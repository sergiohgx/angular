import {AnimationKeyframe, KeyframeStyles} from 'angular2/src/animate/animation_keyframe';
import {StringMapWrapper, ListWrapper} from 'angular2/src/facade/collection';
import {isNumber, isString, isStringMap, NumberWrapper} from 'angular2/src/facade/lang';
import {AnimationStyles} from 'angular2/src/animate/worker/animation_styles';
import {BaseException} from 'angular2/src/facade/exceptions';

var INITIAL_KEYFRAME = '0%';
var TERMINAL_KEYFRAME = '100%';

export class AnimationParser {
  normalizeAnimationIntoKeyframes(tokens: any[], styles: AnimationStyles): AnimationKeyframe[] {
    return _normalizeAnimationKeyframes(tokens, styles);
  }
}

function _normalizeAnimationKeyframes(tokens: any[], styles: AnimationStyles): AnimationKeyframe[] {
  var keyframes = [];
  tokens.forEach((token: any) => {
    var values: AnimationKeyframe[];
    if (isString(token)) {
      switch (token[0]) {
        case '.':
          values = [styles.lookupClass(token)];
          break;

        case '@':
          values = styles.lookupKeyframe(token);
          break;
      }
    } else if (isStringMap(token)) {
      var normalizedStyles: {[key: string]: string} = {};
      StringMapWrapper.forEach(token, (value, prop) => {
        var measurement = isNumber(value) ? _resolveDefaultPropertyMeasurement(prop) : '';
        normalizedStyles[prop] = value.toString() + measurement;
      });

      values = [AnimationKeyframe.fromStyles(TERMINAL_KEYFRAME, normalizedStyles)];
    } else {
      // TODO (matsko): throw proper error
      throw new BaseException('...');
    }

    values.forEach((keyframe: AnimationKeyframe) => {
      var position = keyframe.position;

      var compareValue;
      if (position == 'to') {
        position = keyframe.position = TERMINAL_KEYFRAME;
        compareValue = 100;
      } else if (position == 'from') {
        position = keyframe.position = INITIAL_KEYFRAME;
        compareValue = 0;
      } else {
        let pos = position;
        if (pos[pos.length - 1] == "%") {
          pos = pos.substring(0, pos.indexOf("%"));
        }
        compareValue = NumberWrapper.parseInt(pos, 10);
      }

      var data = {
        'compare': compareValue,
        'keyframe': keyframe
      };

      var nextKeyframe, valueUpdated = false;
      if (keyframes.length > 0) {
        for (var i = 0; i < keyframes.length; i++) {
          let next = keyframes[i];
          let nextCmp = <number>next['compare'];

          nextKeyframe = <AnimationKeyframe>next['keyframe'];
          if (compareValue <= nextCmp) {
            if (compareValue == nextCmp) {
              keyframe.styles.forEach((entry: KeyframeStyles) => {
                nextKeyframe.addStyles(entry.styles);
              });
            } else {
              ListWrapper.insert(keyframes, i, data);
            }
            valueUpdated = true;
            break;
          }
        }
      }

      if (!valueUpdated) {
        keyframes.push(data);
      }
    });
  });

  return keyframes.map((entry) => entry['keyframe']);
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
