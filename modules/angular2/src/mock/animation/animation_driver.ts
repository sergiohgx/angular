import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';
import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/core/animation/animation_player';
import {StringMapWrapper} from 'angular2/src/facade/collection';

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

export class MockAnimationPlayer extends NoOpAnimationPlayer {
  log = [];

  play(): void {
    this.log.push('play');
    super.play();
  }

  pause(): void {
    this.log.push('pause');
    super.pause();
  }

  reverse(): void {
    this.log.push('reverse');
    super.reverse();
  }

  restart(): void {
    this.log.push('restart');
    super.restart();
  }

  finish(): void {
    this.log.push('finish');
    this.flush();
  }

  tick() { }
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
