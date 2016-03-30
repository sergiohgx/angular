import {AnimationPlayer} from 'angular2/src/core/animation/animation_player';

export interface AnimationFactory {
  create(element: any, renderer: any): AnimationPlayer;
}
