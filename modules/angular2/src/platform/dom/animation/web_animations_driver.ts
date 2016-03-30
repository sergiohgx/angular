import {StringMapWrapper} from 'angular2/src/facade/collection';

import {AnimationDriver} from 'angular2/src/core/animation/animation_driver';
import {AnimationPlayer} from 'angular2/src/core/animation/animation_player';
import {AnimationKeyframe} from 'angular2/src/core/animation/animation_keyframe';
import {WebAnimationsPlayer} from 'angular2/src/platform/dom/animation/web_animations_player';

export class WebAnimationsDriver implements AnimationDriver {
  animate(element: Node, keyframes: AnimationKeyframe[], duration: number, delay: number, easing: string): AnimationPlayer {
    var elm = <HTMLElement>element;
    var formattedSteps = [];
    keyframes.forEach((keyframe) => {
      var data = {};
      keyframe.styles.forEach((entry) => {
        StringMapWrapper.forEach(entry.styles, (val, prop) => {
          data[prop] = val;
        });
      });
      data['offset'] = keyframe.position / 100;
      formattedSteps.push(data);
    });

    var player = elm['animate'](formattedSteps, {
      'duration': duration,
      'delay': delay,
      'easing': easing,
      'fill': 'forwards'
    });

    return new WebAnimationsPlayer(player);
  }
}
