import {Renderer} from 'angular2/src/core/render/api';
import {AnimationElement} from 'angular2/src/animate/animation_element';
import {AnimationStyles} from 'angular2/src/animate/worker/animation_styles';
import {AnimationPlayer} from 'angular2/src/animate/animation_player';
import {Set} from 'angular2/src/facade/collection';
import {AnimationToken} from 'angular2/src/animate/worker/animation_step';

export abstract class AnimationDefinition {
  abstract start(element: AnimationElement,
                 context: any,
                 styleLookup: AnimationStyles,
                 renderer: Renderer,
                 startIndex: number): AnimationPlayer;

  abstract stagger(timing: string): AnimationDefinition;

  abstract getTokens(): Set<AnimationToken>;
}
