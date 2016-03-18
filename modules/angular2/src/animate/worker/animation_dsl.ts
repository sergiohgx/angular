import {isArray, isPresent, isString, isStringMap} from 'angular2/src/facade/lang';
import {BaseException} from 'angular2/src/facade/exceptions';
import {StringMapWrapper} from 'angular2/src/facade/collection';

import {AnimationDefinition} from 'angular2/src/animate/worker/animation_definition';
import {AnimationStep} from 'angular2/src/animate/worker/animation_step';
import {AnimationQuery} from 'angular2/src/animate/worker/animation_query';
import {AnimationSequence} from 'angular2/src/animate/worker/animation_sequence';
import {AnimationGroup} from 'angular2/src/animate/worker/animation_group';
import {AnimationToken, AnimationTokenType} from 'angular2/src/animate/worker/animation_step';
import {parseTimeExpression} from 'angular2/src/animate/shared';

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

function parseInlineValues(values: {[key: string]: string|number}): {[key:string]: string} {
  var newValues: {[key:string]:string} = {};
  StringMapWrapper.forEach(values, (value, prop) => {
    if (!isString(value)) {
      value = value.toString() + _resolveDefaultPropertyMeasurement(prop);
    }
    newValues[prop] = value;
  });
  return newValues;
}

function parseTokens(tokens: any[]): AnimationToken[] {
  return tokens.map((value) => {
    var type;
    if (isString(value)) {
      switch (value[0]) {
        case '.':
          type = AnimationTokenType.CSS_CLASS;
          break;
        case '@':
          type = AnimationTokenType.CSS_KEYFRAME;
          break;
      }
    } else if (isStringMap(value)) {
      type = AnimationTokenType.INLINE_STYLES;
      value = parseInlineValues(value);
    }

    if (!isPresent(type)) {
      throw new BaseException('unsupported value "' + value + '" in animation step definition');
    }

    return new AnimationToken(type, value);
  });
}

export function query(selector: string, steps: AnimationGroup|AnimationDefinition[]): AnimationDefinition {
  return new AnimationQuery(selector, steps);
}

export function animate(tokens: {[key: string]: string|number|boolean}|string|any[], timing: string|number): AnimationDefinition {
  var tokenList: any[];
  if (isString(tokens)) {
    tokenList = [<string>tokens];
  } else if (isArray(tokens)) {
    tokenList = <string[]>tokens;
  } else if (isStringMap(tokens)) {
    tokenList = [tokens];
  }
  var timeData = parseTimeExpression(timing);
  return new AnimationStep(parseTokens(tokenList), timeData[0], timeData[1], timeData[2]);
}

export function group(steps: AnimationDefinition[]): AnimationDefinition {
  return new AnimationGroup(steps);
}

export function sequence(steps: AnimationDefinition[]): AnimationDefinition {
  return new AnimationSequence(steps);
}

export function style(tokens: {[key: string]: string|number|boolean}|string|any[]): AnimationDefinition {
  var tokenList: any[];
  if (isString(tokens)) {
    tokenList = [<string>tokens];
  } else if (isArray(tokens)) {
    tokenList = <string[]>tokens;
  } else if (isStringMap(tokens)) {
    tokenList = [tokens];
  }
  return new AnimationStep(parseTokens(tokenList));
}
