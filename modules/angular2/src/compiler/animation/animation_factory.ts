import {DomRenderer} from 'angular2/src/platform/dom/dom_renderer';

import {AnimationFactory} from 'angular2/src/core/animation/animation_factory';
import {AnimationPlayer} from 'angular2/src/core/animation/animation_player';
import {AnimationGroupPlayer} from 'angular2/src/core/animation/animation_group_player';
import {AnimationSequencePlayer} from 'angular2/src/core/animation/animation_sequence_player';

import {AnimationKeyframeAst} from 'angular2/src/compiler/animation/animation_keyframe_ast';
import {AnimationKeyframeStylesAst} from 'angular2/src/compiler/animation/animation_keyframe_styles_ast';
import {AnimationSequenceAst} from 'angular2/src/compiler/animation/animation_sequence_ast';
import {AnimationGroupAst} from 'angular2/src/compiler/animation/animation_group_ast';
import {AnimationStepAst} from 'angular2/src/compiler/animation/animation_step_ast';
import {AnimationAst} from 'angular2/src/compiler/animation/animation_ast';
import {AnimationAstVisitor} from 'angular2/src/compiler/animation/animation_ast_visitor';

import {AnimationKeyframe} from 'angular2/src/core/animation/animation_keyframe';
import {AnimationKeyframeStyles} from 'angular2/src/core/animation/animation_keyframe_styles';

export class RuntimeAnimationFactory implements AnimationFactory {
  private _builder: _AnimationBuilder;
  constructor(ast) {
    this._builder = new _AnimationBuilder(ast);
  }
  create(element: any, renderer: any): AnimationPlayer {
    return this._builder.build(new _AnimationFactoryContext(element, renderer));
  }
}

class _AnimationFactoryContext {
  constructor(public element: any, public renderer: DomRenderer) {}
}

class _AnimationBuilder implements AnimationAstVisitor {
  constructor(private _ast: AnimationAst) {}

  visitAnimationKeyframeStyles(ast: AnimationKeyframeStylesAst, context: _AnimationFactoryContext): AnimationKeyframeStyles {
    return new AnimationKeyframeStyles(ast.styles);
  }

  visitAnimationKeyframe(ast: AnimationKeyframeAst, context: _AnimationFactoryContext): AnimationKeyframe {
    var styles = ast.styles.map(styleEntry => styleEntry.visit(this, context));
    return new AnimationKeyframe(ast.position, styles);
  }

  visitAnimationStep(ast: AnimationStepAst, context: _AnimationFactoryContext): AnimationPlayer {
    var keyframes = ast.keyframes.map(keyframeEntry => keyframeEntry.visit(this, context));
    return context.renderer.animate(context.element, keyframes, ast.duration, ast.delay, ast.easing);
  }

  visitAnimationSequence(ast: AnimationSequenceAst, context: _AnimationFactoryContext): AnimationPlayer {
    var players = ast.steps.map(step => step.visit(this, context));
    return new AnimationSequencePlayer(players);
  }

  visitAnimationGroup(ast: AnimationGroupAst, context: _AnimationFactoryContext): AnimationPlayer {
    var players = ast.steps.map(step => step.visit(this, context));
    return new AnimationGroupPlayer(players);
  }

  build(context: _AnimationFactoryContext): AnimationPlayer {
    return this._ast.visit(this, context);
  }
}
