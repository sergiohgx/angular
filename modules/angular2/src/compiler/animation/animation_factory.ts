import {DomRenderer} from 'angular2/src/platform/dom/dom_renderer';
import {Renderer} from 'angular2/src/core/render/api';
import {Map} from 'angular2/src/facade/collection';
import {isPresent} from 'angular2/src/facade/lang';
import {Math} from 'angular2/src/facade/math';

import {AnimationPlayer} from 'angular2/src/core/animation/animation_player';
import {AnimationGroupPlayer} from 'angular2/src/core/animation/animation_group_player';
import {AnimationSequencePlayer} from 'angular2/src/core/animation/animation_sequence_player';

import {
  AnimationAst,
  AnimationKeyframeAst,
  AnimationKeyframeStylesAst,
  AnimationSequenceAst,
  AnimationGroupAst,
  AnimationAnimateStepAst,
  AnimationStyleStepAst,
  AnimationAstVisitor
} from 'angular2/src/compiler/animation/animation_ast';

import {
  AnimationEvent,
  EnterAnimationEvent,
  LeaveAnimationEvent,
  AddClassAnimationEvent,
  RemoveClassAnimationEvent,
  SetAttributeAnimationEvent,
  RemoveAttributeAnimationEvent
} from 'angular2/src/compiler/animation/animation_event';

import {AnimationKeyframe} from 'angular2/src/core/animation/animation_keyframe';
import {AnimationKeyframeStyles} from 'angular2/src/core/animation/animation_keyframe_styles';

export class AnimationFactory {
  private _builder: _AnimationBuilder;

  constructor(ast: AnimationAst) {
    this._builder = new _AnimationBuilder(ast);
  }

  public create(element: any, renderer: Renderer) {
    return this._builder.build(new _AnimationFactoryContext(element, renderer));
  }
}

class _AnimationFactoryContext {
  constructor(public element: any, public renderer: DomRenderer) {}
}

class _AnimationBuilder implements AnimationAstVisitor {
  constructor(private _ast: AnimationAst) {}

  private _animateStep(context: _AnimationFactoryContext, keyframes: AnimationKeyframe[],
                       duration: number, delay: number, easing: string): AnimationPlayer {
    return context.renderer.animate(context.element, keyframes, duration, delay, easing);
  }

  visitAnimationKeyframeStyles(ast: AnimationKeyframeStylesAst,
                               context: _AnimationFactoryContext): AnimationKeyframeStyles {
    return new AnimationKeyframeStyles(ast.styles);
  }

  visitAnimationKeyframe(ast: AnimationKeyframeAst,
                         context: _AnimationFactoryContext): AnimationKeyframe {
    var styles = ast.styles.map(styleEntry => styleEntry.visit(this, context));
    return new AnimationKeyframe(ast.position, styles);
  }

  visitAnimationAnimateStep(ast: AnimationAnimateStepAst,
                            context: _AnimationFactoryContext): AnimationPlayer {
    var keyframes = ast.keyframes.map(keyframeEntry => keyframeEntry.visit(this, context));
    return this._animateStep(context, keyframes, ast.duration, ast.delay, ast.easing);
  }

  visitAnimationStyleStep(ast: AnimationStyleStepAst,
                          context: _AnimationFactoryContext): AnimationPlayer {
    var keyframe = ast.keyframe.visit(this, context);
    return this._animateStep(context, [keyframe], 0, 0, null);
  }

  visitAnimationSequence(ast: AnimationSequenceAst,
                         context: _AnimationFactoryContext): AnimationPlayer {
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
