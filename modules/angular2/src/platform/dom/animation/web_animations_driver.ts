import {StringMapWrapper} from 'angular2/src/facade/collection';
import {isNumber, StringWrapper} from 'angular2/src/facade/lang';
import {BaseException} from 'angular2/src/facade/exceptions';

import {AnimationDriver} from 'angular2/src/core/render/animation_driver';
import {AnimationPlayer, NoOpAnimationPlayer} from 'angular2/src/core/animation/animation_player';
import {AnimationKeyframe} from 'angular2/src/core/animation/animation_keyframe';
import {WebAnimationsPlayer} from 'angular2/src/platform/dom/animation/web_animations_player';

export class WebAnimationsDriver implements AnimationDriver {
  animate(element: any, keyframes: AnimationKeyframe[], duration: number, delay: number,
          easing: string): AnimationPlayer {
    if (keyframes.length == 0) {
      return new NoOpAnimationPlayer();
    }

    var formattedSteps = [];
    keyframes.forEach((keyframe) => {
      var data = {};
      keyframe.styles.forEach((entry) => {
        StringMapWrapper.forEach(entry.styles, (val, prop) => {
          data[prop] = val.toString() + _resolveStyleUnit(val, prop);
        });
      });
      if (keyframes.length > 1) {
        data['offset'] = keyframe.position / 100;
      }
      formattedSteps.push(data);
    });

    if (keyframes.length == 1) {
      var firstStep = formattedSteps[0];
      formattedSteps = [firstStep, firstStep];
      duration = delay = 0;
    }

    var anyElm = <any>element;
    var player = anyElm.animate(
        formattedSteps,
        {'duration': duration, 'delay': delay, 'easing': easing, 'fill': 'forwards'});

    return new WebAnimationsPlayer(player);
  }
}

function _resolveStyleUnit(val: string | number, prop: string): string {
  var unit = '';
  if (_isPixelDimensionStyle(prop) && val != 0 && val != '0') {
    if (isNumber(val)) {
      unit = 'px';
    } else if (_findDimensionalSuffix(val.toString()).length == 0) {
      throw new BaseException('Please provide a CSS unit value for ' + prop + ':' + val);
    }
  }
  return unit;
}

const _$0 = 48;
const _$9 = 57;
const _$PERIOD = 46;

function _findDimensionalSuffix(value: string): string {
  for (var i = 0; i < value.length; i++) {
    var c = StringWrapper.charCodeAt(value, i);
    if ((c >= _$0 && c <= _$9) || c == _$PERIOD) continue;
    return value.substring(i, value.length);
  }
  return '';
}

function _isPixelDimensionStyle(prop: string): boolean {
  switch (prop) {
    case 'width':
    case 'height':
    case 'min-width':
    case 'min-height':
    case 'max-width':
    case 'max-height':
    case 'left':
    case 'top':
    case 'bottom':
    case 'right':
    case 'font-size':
    case 'outline-width':
    case 'outline-offset':
    case 'padding-top':
    case 'padding-left':
    case 'padding-bottom':
    case 'padding-right':
    case 'margin-top':
    case 'margin-left':
    case 'margin-bottom':
    case 'margin-right':
    case 'border-radius':
    case 'border-width':
    case 'border-top-width':
    case 'border-left-width':
    case 'border-right-width':
    case 'border-bottom-width':
    case 'text-indent':
      return true;

    default:
      return false;
  }
}
