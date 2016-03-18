import {AnimationElement} from 'angular2/src/animate/animation_element';
import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/animate/animation_player';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';

export abstract class AnimationDriver {
  abstract createSnapshot(element: AnimationElement, name: string, styleProperties: string[]): string;
  abstract clearSnapshots(ids: string[]): void;
  abstract animate(element: AnimationElement, keyframes: AnimationKeyframe[], duration: number, delay: number, easing: string, transforms: string[]): AnimationPlayer;
}

export class NoOpAnimationDriver extends AnimationDriver {
  createSnapshot(element: AnimationElement, name: string, styleProperties: string[]): string { return null; }
  clearSnapshots(ids: string[]): void { }
  animate(element: AnimationElement, keyframes: AnimationKeyframe[], duration: number, delay: number, easing: string, transforms: string[]): AnimationPlayer {
    return new NoOpAnimationPlayer();
  }
}
