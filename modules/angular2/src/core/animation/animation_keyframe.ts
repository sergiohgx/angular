import {AnimationKeyframeStyles} from 'angular2/src/core/animation/animation_keyframe_styles';

export class AnimationKeyframe {
  constructor(public position: number, public styles: AnimationKeyframeStyles[]) {}
}
