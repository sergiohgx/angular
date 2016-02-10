import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/core/animation/animation_player';
import {AnimationKeyframe} from 'angular2/src/core/animation/animation_keyframe';

export abstract class AnimationDriver {
  abstract animate(element: any, keyframes: AnimationKeyframe[], duration: number, delay: number,
                   easing: string): AnimationPlayer;
}

export class NoOpAnimationDriver extends AnimationDriver {
  animate(element: any, keyframes: AnimationKeyframe[], duration: number, delay: number,
          easing: string): AnimationPlayer {
    return new NoOpAnimationPlayer();
  }
}
