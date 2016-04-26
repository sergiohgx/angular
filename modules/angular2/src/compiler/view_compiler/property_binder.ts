import * as cdAst from '../expression_parser/ast';
import * as o from '../output/output_ast';
import {Identifiers} from '../identifiers';
import {DetectChangesVars} from './constants';

import {
  BoundTextAst,
  BoundElementPropertyAst,
  DirectiveAst,
  PropertyBindingType,
  TemplateAst
} from '../template_ast';

import {isBlank, isPresent, isArray, CONST_EXPR} from 'angular2/src/facade/lang';

import {CompileView} from './compile_view';
import {CompileElement, CompileNode} from './compile_element';
import {CompileMethod} from './compile_method';

import {LifecycleHooks} from 'angular2/src/core/metadata/lifecycle_hooks';
import {isDefaultChangeDetectionStrategy} from 'angular2/src/core/change_detection/constants';
import {camelCaseToDashCase} from '../util';

import {convertCdExpressionToIr} from './expression_converter';

import {CompileBinding} from './compile_binding';
import {BaseException} from 'angular2/src/facade/exceptions';
import {CompileAnimation} from '../animation_compiler';
import {EMPTY_STATE, ANY_STATE} from 'angular2/src/core/animation/animation_state_event';

function createBindFieldExpr(exprIndex: number): o.ReadPropExpr {
  return o.THIS_EXPR.prop(`_expr_${exprIndex}`);
}

function createCurrValueExpr(exprIndex: number): o.ReadVarExpr {
  return o.variable(`currVal_${exprIndex}`);
}

function bind(view: CompileView, currValExpr: o.ReadVarExpr, fieldExpr: o.ReadPropExpr,
              parsedExpression: cdAst.AST, context: o.Expression, actions: o.Statement[],
              method: CompileMethod) {
  var checkExpression =
      convertCdExpressionToIr(view, context, parsedExpression, DetectChangesVars.valUnwrapper);
  if (isBlank(checkExpression.expression)) {
    // e.g. an empty expression was given
    return;
  }

  view.fields.push(new o.ClassField(fieldExpr.name, null, [o.StmtModifier.Private]));
  view.createMethod.addStmt(
      o.THIS_EXPR.prop(fieldExpr.name).set(o.importExpr(Identifiers.uninitialized)).toStmt());

  if (checkExpression.needsValueUnwrapper) {
    var initValueUnwrapperStmt = DetectChangesVars.valUnwrapper.callMethod('reset', []).toStmt();
    method.addStmt(initValueUnwrapperStmt);
  }
  method.addStmt(
      currValExpr.set(checkExpression.expression).toDeclStmt(null, [o.StmtModifier.Final]));

  var condition: o.Expression =
      o.importExpr(Identifiers.checkBinding)
          .callFn([DetectChangesVars.throwOnChange, fieldExpr, currValExpr]);
  if (checkExpression.needsValueUnwrapper) {
    condition = DetectChangesVars.valUnwrapper.prop('hasWrappedValue').or(condition);
  }
  method.addStmt(new o.IfStmt(
      condition,
      actions.concat([<o.Statement>o.THIS_EXPR.prop(fieldExpr.name).set(currValExpr).toStmt()])));
}

export function bindRenderText(boundText: BoundTextAst, compileNode: CompileNode,
                               view: CompileView) {
  var bindingIndex = view.bindings.length;
  view.bindings.push(new CompileBinding(compileNode, boundText));
  var currValExpr = createCurrValueExpr(bindingIndex);
  var valueField = createBindFieldExpr(bindingIndex);
  view.detectChangesRenderPropertiesMethod.resetDebugInfo(compileNode.nodeIndex, boundText);

  bind(view, currValExpr, valueField, boundText.value, o.THIS_EXPR.prop('context'),
       [
         o.THIS_EXPR.prop('renderer')
             .callMethod('setText', [compileNode.renderNode, currValExpr])
             .toStmt()
       ],
       view.detectChangesRenderPropertiesMethod);
}

function bindAndWriteToRenderer(boundProps: BoundElementPropertyAst[], context: o.Expression,
                                compileElement: CompileElement) {
  var view = compileElement.view;
  var renderNode = compileElement.renderNode;
  boundProps.forEach((boundProp) => {
    var bindingIndex = view.bindings.length;
    view.bindings.push(new CompileBinding(compileElement, boundProp));
    view.detectChangesRenderPropertiesMethod.resetDebugInfo(compileElement.nodeIndex, boundProp);
    var fieldExpr = createBindFieldExpr(bindingIndex);
    var currValExpr = createCurrValueExpr(bindingIndex);
    var updateStmts = [];
    var renderValue;
    switch (boundProp.type) {
      case PropertyBindingType.Property:
        if (view.genConfig.logBindingUpdate) {
          updateStmts.push(logBindingUpdateStmt(renderNode, boundProp.name, currValExpr));
        }
        updateStmts.push(
            o.THIS_EXPR.prop('renderer')
                .callMethod('setElementProperty', [renderNode, o.literal(boundProp.name), currValExpr])
                .toStmt()
        );
        break;
      case PropertyBindingType.Attribute:
        renderValue = currValExpr.isBlank().conditional(o.NULL_EXPR, currValExpr.callMethod('toString', []));
        updateStmts.push(
            o.THIS_EXPR.prop('renderer')
                .callMethod('setElementAttribute', [renderNode, o.literal(boundProp.name), renderValue])
                .toStmt()
        );
        break;
      case PropertyBindingType.Class:
        updateStmts.push(
            o.THIS_EXPR.prop('renderer')
                .callMethod('setElementClass', [renderNode, o.literal(boundProp.name), currValExpr])
                .toStmt()
        );
        break;
      case PropertyBindingType.Style:
        var strValue: o.Expression = currValExpr.callMethod('toString', []);
        if (isPresent(boundProp.unit)) {
          strValue = strValue.plus(o.literal(boundProp.unit));
        }
        renderValue = currValExpr.isBlank().conditional(o.NULL_EXPR, strValue);
        updateStmts.push(
            o.THIS_EXPR.prop('renderer')
                .callMethod('setElementStyle', [renderNode, o.literal(boundProp.name), renderValue])
                .toStmt()
        );
        break;
      case PropertyBindingType.Animation:
        var animations = view.componentView.animations.get(boundProp.name);
        if (isBlank(animations)) {
          throw new BaseException(`Internal Error: couldn't find animations for ${boundProp.name}`);
        }

        var ANIMATION_FIRED_VAL = o.variable('animationFired');
        var TRUE_VAL = o.literal(true);
        var FALSE_VAL = o.literal(false);
        updateStmts.push(ANIMATION_FIRED_VAL.set(FALSE_VAL).toDeclStmt());
        animations.forEach((animation: CompileAnimation) => {
          updateStmts.push(
            new o.IfStmt(
                  ANIMATION_FIRED_VAL.equals(FALSE_VAL)
                  .and(_compareToAnimationStateExpr(fieldExpr, animation.event.fromState))
                  .and(_compareToAnimationStateExpr(currValExpr, animation.event.toState)), [
                    animation.animationFactory.callFn([
                      o.THIS_EXPR.prop('renderer'),
                      renderNode
                    ]).callMethod('play', []).toStmt(),
                    ANIMATION_FIRED_VAL.set(TRUE_VAL).toStmt()
                ])
          );
        });
        break;
    }

    bind(view, currValExpr, fieldExpr, boundProp.value, context, updateStmts,
         view.detectChangesRenderPropertiesMethod);
  });
}

function _compareToAnimationStateExpr(value: o.Expression, animationState: string): o.Expression {
  if (animationState == EMPTY_STATE) {
    return value.equals(o.importExpr(Identifiers.uninitialized));
  } else if (animationState == ANY_STATE) {
    return o.not(value.equals(o.importExpr(Identifiers.uninitialized)));
  } else {
    return value.equals(o.literal(animationState));
  }
}

export function bindRenderInputs(boundProps: BoundElementPropertyAst[],
                                 compileElement: CompileElement): void {
  bindAndWriteToRenderer(boundProps, o.THIS_EXPR.prop('context'), compileElement);
}

export function bindDirectiveHostProps(directiveAst: DirectiveAst, directiveInstance: o.Expression,
                                       compileElement: CompileElement): void {
  bindAndWriteToRenderer(directiveAst.hostProperties, directiveInstance, compileElement);
}

export function bindDirectiveInputs(directiveAst: DirectiveAst, directiveInstance: o.Expression,
                                    compileElement: CompileElement) {
  if (directiveAst.inputs.length === 0) {
    return;
  }
  var view = compileElement.view;
  var detectChangesInInputsMethod = view.detectChangesInInputsMethod;
  detectChangesInInputsMethod.resetDebugInfo(compileElement.nodeIndex, compileElement.sourceAst);

  var lifecycleHooks = directiveAst.directive.lifecycleHooks;
  var calcChangesMap = lifecycleHooks.indexOf(LifecycleHooks.OnChanges) !== -1;
  var isOnPushComp = directiveAst.directive.isComponent &&
                     !isDefaultChangeDetectionStrategy(directiveAst.directive.changeDetection);
  if (calcChangesMap) {
    detectChangesInInputsMethod.addStmt(DetectChangesVars.changes.set(o.NULL_EXPR).toStmt());
  }
  if (isOnPushComp) {
    detectChangesInInputsMethod.addStmt(DetectChangesVars.changed.set(o.literal(false)).toStmt());
  }
  directiveAst.inputs.forEach((input) => {
    var bindingIndex = view.bindings.length;
    view.bindings.push(new CompileBinding(compileElement, input));
    detectChangesInInputsMethod.resetDebugInfo(compileElement.nodeIndex, input);
    var fieldExpr = createBindFieldExpr(bindingIndex);
    var currValExpr = createCurrValueExpr(bindingIndex);
    var statements: o.Statement[] =
        [directiveInstance.prop(input.directiveName).set(currValExpr).toStmt()];
    if (calcChangesMap) {
      statements.push(new o.IfStmt(DetectChangesVars.changes.identical(o.NULL_EXPR), [
        DetectChangesVars.changes.set(o.literalMap([], new o.MapType(
                                                           o.importType(Identifiers.SimpleChange))))
            .toStmt()
      ]));
      statements.push(
          DetectChangesVars.changes.key(o.literal(input.directiveName))
              .set(o.importExpr(Identifiers.SimpleChange).instantiate([fieldExpr, currValExpr]))
              .toStmt());
    }
    if (isOnPushComp) {
      statements.push(DetectChangesVars.changed.set(o.literal(true)).toStmt());
    }
    if (view.genConfig.logBindingUpdate) {
      statements.push(
          logBindingUpdateStmt(compileElement.renderNode, input.directiveName, currValExpr));
    }
    bind(view, currValExpr, fieldExpr, input.value, o.THIS_EXPR.prop('context'), statements,
         detectChangesInInputsMethod);
  });
  if (isOnPushComp) {
    detectChangesInInputsMethod.addStmt(new o.IfStmt(DetectChangesVars.changed, [
      compileElement.appElement.prop('componentView')
          .callMethod('markAsCheckOnce', [])
          .toStmt()
    ]));
  }
}

function logBindingUpdateStmt(renderNode: o.Expression, propName: string,
                              value: o.Expression): o.Statement {
  return o.THIS_EXPR.prop('renderer')
      .callMethod('setBindingDebugInfo',
                  [
                    renderNode,
                    o.literal(`ng-reflect-${camelCaseToDashCase(propName)}`),
                    value.isBlank().conditional(o.NULL_EXPR, value.callMethod('toString', []))
                  ])
      .toStmt();
}
