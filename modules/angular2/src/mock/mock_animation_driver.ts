import {AnimationDriver} from 'angular2/src/core/render/animation_driver';
import {AnimationKeyframe} from 'angular2/src/core/animation/animation_keyframe';
import {AnimationPlayer} from 'angular2/src/core/animation/animation_player';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {MockAnimationPlayer} from 'angular2/src/mock/mock_animation_player';

export class MockAnimationDriver extends AnimationDriver {
  log = [];
  animate(element: Node, keyframes: AnimationKeyframe[], duration: number, delay: number,
          easing: string): AnimationPlayer {
    var player = new MockAnimationPlayer();
    this.log.push({
      'element': element,
      'keyframes': keyframes,
      'keyframeLookup': _serializeKeyframes(keyframes),
      'duration': duration,
      'delay': delay,
      'easing': easing,
      'player': player
    });
    return player;
  }
}

function _serializeKeyframes(keyframes: AnimationKeyframe[]): any[] {
  return keyframes.map(keyframe => {
    var styles = {};
    keyframe.styles.forEach((entry) => {
      StringMapWrapper.forEach(entry.styles, (val, prop) => { styles[prop] = val; });
    });
    return [keyframe.position, styles];
  });
}
