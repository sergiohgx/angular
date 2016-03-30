import {AnimationDriver} from 'angular2/src/core/animation/animation_driver';
import {AnimationKeyframe} from 'angular2/src/core/animation/animation_keyframe';
import {AnimationPlayer} from 'angular2/src/core/animation/animation_player';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {MockAnimationPlayer} from 'angular2/src/mock/animation/mock_animation_player';

function combineStyles(keyframes: AnimationKeyframe[]) {
  var allStyles = {};
  keyframes.forEach((kf) => {
    kf.styles.forEach((entry) => {
      StringMapWrapper.forEach(entry.styles, (val, prop) => {
        allStyles[prop] = val;
      });
    });
  });
  return allStyles;
}

export class MockAnimationDriver extends AnimationDriver {
  log = [];
  animate(element: Node, keyframes: AnimationKeyframe[], duration: number, delay: number, easing: string): AnimationPlayer {
    var player = new MockAnimationPlayer();
    this.log.push({
      'element': element,
      'keyframes': keyframes,
      'keyframeStyles': combineStyles(keyframes),
      'duration': duration,
      'delay': delay,
      'easing': easing,
      'player': player
    });
    return player;
  }
}
