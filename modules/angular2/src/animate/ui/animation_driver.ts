import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/core/animation/animation_player';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';

export abstract class AnimationDriver {
  abstract animate(element: Node, keyframes: AnimationKeyframe[], duration: number, delay: number, easing: string): AnimationPlayer;
}

export class NoOpAnimationDriver extends AnimationDriver {
  animate(element: Node, keyframes: AnimationKeyframe[], duration: number, delay: number, easing: string): AnimationPlayer {
    return new NoOpAnimationPlayer();
  }
}
