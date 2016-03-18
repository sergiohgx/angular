import {isArray} from 'angular2/src/facade/lang';
import {Set} from 'angular2/src/facade/collection';

import {Renderer} from 'angular2/src/core/render/api';
import {AnimationElement} from 'angular2/src/animate/animation_element';
import {AnimationStyles} from 'angular2/src/animate/worker/animation_styles';
import {AnimationGroupPlayer} from 'angular2/src/animate/worker/animation_group';
import {AnimationSequence} from 'angular2/src/animate/worker/animation_sequence';
import {AnimationDefinition} from 'angular2/src/animate/worker/animation_definition';
import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/animate/animation_player';
import {AnimationToken} from 'angular2/src/animate/worker/animation_step';

import {DOM} from 'angular2/src/platform/dom/dom_adapter';

export class AnimationQuery extends AnimationDefinition {
  private _animation: AnimationDefinition;

  constructor(private _selector: string, private _steps: AnimationDefinition|AnimationDefinition[]) {
    super();
    if (isArray(_steps)) {
      this._animation = new AnimationSequence(<AnimationDefinition[]>_steps);
    } else {
      this._animation = <AnimationDefinition>_steps;
    }
  }

  start(element: AnimationElement,
        context: any,
        styleLookup: AnimationStyles,
        renderer: Renderer,
        startIndex: number): AnimationPlayer {

    var players = [];
    var i = startIndex;
    var node = element.element;
    var elementContext = element.context;

    DOM.querySelectorAll(node, this._selector).forEach((child) => {
      var animationElement = new AnimationElement(child, elementContext);
      var player = this._animation.start(animationElement, context, styleLookup, renderer, i++);
      players.push(player);
    });

    return new AnimationGroupPlayer(players);
  }

  stagger(timing: string): AnimationDefinition {
    return this;
  }

  getTokens(): Set<AnimationToken> {
    return null;
  }
}
