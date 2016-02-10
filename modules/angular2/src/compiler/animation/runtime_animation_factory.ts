import {DomRenderer} from 'angular2/src/platform/dom/dom_renderer';
import {Renderer} from 'angular2/src/core/render/api';
import {Map} from 'angular2/src/facade/collection';
import {isPresent} from 'angular2/src/facade/lang';
import {Math} from 'angular2/src/facade/math';

import {AnimationFactory} from 'angular2/src/core/animation/animation_factory';
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

export class RuntimeAnimationFactory implements AnimationFactory {
  private _animationByEvent = new Map<string, _AnimationFactoryEventEntry[]>();

  constructor(entries: Map<AnimationEvent, AnimationAst>) {
    entries.forEach((ast, event) => {
      var builder = new _AnimationBuilder(ast);
      var tuple = new _AnimationFactoryEventEntry(event, builder);
      var list = this._animationByEvent.get(event.id);
      if (!isPresent(list)) {
        this._animationByEvent.set(event.id, list = []);
      }
      list.push(tuple);
    });
  }
  private _buildAndCreatePlayer(event: AnimationEvent, element: any,
                                renderer: Renderer): AnimationPlayer {
    var builder = _findMostAccurateBuilder(event, this._animationByEvent.get(event.id));
    if (isPresent(builder)) {
      return builder.build(new _AnimationFactoryContext(element, <DomRenderer>renderer));
    }
    return null;
  }
  createEnterAnimation(element: any, renderer: Renderer): AnimationPlayer {
    return this._buildAndCreatePlayer(new EnterAnimationEvent(), element, renderer);
  }
  createLeaveAnimation(element: any, renderer: Renderer): AnimationPlayer {
    return this._buildAndCreatePlayer(new LeaveAnimationEvent(), element, renderer);
  }
  createAddClassAnimation(className: string, element: any, renderer: Renderer): AnimationPlayer {
    return this._buildAndCreatePlayer(new AddClassAnimationEvent(className), element, renderer);
  }
  createRemoveClassAnimation(className: string, element: any, renderer: Renderer): AnimationPlayer {
    return this._buildAndCreatePlayer(new RemoveClassAnimationEvent(className), element, renderer);
  }
  createRemoveAttributeAnimation(attrName: string, element: any,
                                 renderer: Renderer): AnimationPlayer {
    return this._buildAndCreatePlayer(new RemoveAttributeAnimationEvent(attrName), element,
                                      renderer);
  }
  createSetAttributeAnimation(attrName: string, attrValue: string, element: any,
                              renderer: Renderer): AnimationPlayer {
    return this._buildAndCreatePlayer(new SetAttributeAnimationEvent(attrName, attrValue), element,
                                      renderer);
  }
}

export class _AnimationFactoryEventEntry {
  constructor(public event: AnimationEvent, public builder: _AnimationBuilder) {}
}

function _computeTokenScore(sourceEvent: AnimationEvent, targetEvent: AnimationEvent): number {
  var tokensA = sourceEvent.tokens;
  var tokensB = targetEvent.tokens;
  if (tokensA.length == 0) return 0;
  var score = 0;
  var min = Math.min(tokensA.length, tokensB.length);
  for (var i = 0; i < min; i++) {
    if (tokensA[i] == tokensB[i]) {
      score++;
    }
  }
  return score == tokensA.length ? score : -1;
}

function _findMostAccurateBuilder(event: AnimationEvent,
                                  builderList: _AnimationFactoryEventEntry[]): _AnimationBuilder {
  var match: _AnimationBuilder = null;
  if (isPresent(builderList) && builderList.length > 0) {
    var firstItem = builderList[0];
    match = firstItem.builder;
    var matchScore = _computeTokenScore(firstItem.event, event);
    for (var i = 1; i < builderList.length; i++) {
      let nextItem = builderList[i];
      let nextScore = _computeTokenScore(nextItem.event, event);
      if (nextScore > matchScore) {
        match = nextItem.builder;
        matchScore = nextScore;
      }
    }
  }
  return match;
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
