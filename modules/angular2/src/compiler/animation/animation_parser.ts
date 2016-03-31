import {StringMapWrapper} from 'angular2/src/facade/collection';
import {RegExpWrapper, isPresent, isNumber, isString, isStringMap, NumberWrapper} from 'angular2/src/facade/lang';

import {BaseException} from 'angular2/src/facade/exceptions';
import {TERMINAL_KEYFRAME, AnimationKeyframeAst} from 'angular2/src/compiler/animation/animation_keyframe_ast';

import {AnimationKeyframeStylesAst} from 'angular2/src/compiler/animation/animation_keyframe_styles_ast';

var ONE_SECOND = 1000;

export function parseTimeExpression(exp: string|number): any[] {
  var duration: number = 0;
  var delay: number = 0;
  var easing: string = null;
  if (isString(exp)) {
    var values = (<string>exp).split(' ');
    var i = 0;

    if (isPresent(values[i])) {
      duration = parseTime(values[i++]);
    }

    // this means that the delay number value was detected
    var next = values.length > 1 ? values[i] : null;
    if (next != null && RegExpWrapper.test(/[0-9]/g, next[0])) {
      i++;
      delay = parseTime(next);
    }

    if (isPresent(values[i])) {
      easing = values[i];
    }
  } else {
    duration = <number>exp;
  }

  return [duration, delay, easing];
}

export function parseTime(time:string): number {
  var value = 0;
  var modifier = 1;
  if (isPresent(time) && time.length > 0) {
    var lastChar = time[time.length - 1];
    var chop = 0;
    if (lastChar == 's') {
      chop++;
      var secondLastChar = time[time.length - 2];
      if (secondLastChar == 'm') {
        chop++;
      } else {
        modifier = ONE_SECOND;
      }
    }
    value = NumberWrapper.parseFloat(time.substring(0, time.length - chop)) * modifier;
  }
  return value;
}

export function parseAnimationIntoKeyframes(tokens: any[]): AnimationKeyframeAst[] {
  // we use an array here since the
  // position value will be something
  // between 0 and 100 and we can gaurantee
  // that we will only deal with integers
  var registry: AnimationKeyframeAst[] = [];
  tokens.forEach((token: any) => {
    if (!isStringMap(token)) {
      // TODO (matsko): throw proper error
      throw new BaseException('...');
    }

    var normalizedStyles: {[key: string]: string} = {};
    StringMapWrapper.forEach(token, (value, prop) => {
      var measurement = isNumber(value) ? _resolveDefaultPropertyMeasurement(prop) : '';
      normalizedStyles[prop] = value.toString() + measurement;
    });

    var keyframe = new AnimationKeyframeAst(TERMINAL_KEYFRAME, [
      new AnimationKeyframeStylesAst(normalizedStyles)
    ]);

    var position = keyframe.position;
    var existingEntry = registry[position];
    if (isPresent(existingEntry)) {
      keyframe.styles.forEach((entry: AnimationKeyframeStylesAst) => {
        // TODO (matsko): change this to an array iteration once we provide
        // suppport for multiple styles, classes, and keyframes...
        existingEntry.styles[0].addStyles(entry.styles);
      });
    } else {
      registry[position] = keyframe;
    }
  });

  return registry.filter(entry => isPresent(entry));
}

function _resolveDefaultPropertyMeasurement(prop): string {
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
      return 'px';

    default:
      return '';
  }
}
