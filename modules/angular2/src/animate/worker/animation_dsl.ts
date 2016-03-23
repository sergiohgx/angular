import {isArray, isString, isStringMap} from 'angular2/src/facade/lang';

import {
  AnimationMetadata,
  AnimationStepsMetadata,
  AnimationStepMetadata,
  AnimationGroupMetadata,
  AnimationSequenceMetadata
} from 'angular2/src/core/metadata/animate';

export function animate(tokens: {[key: string]: string|number|boolean}|string|any[], timing: string|number): AnimationStepMetadata {
  var tokenList: any[];
  if (isString(tokens)) {
    tokenList = [<string>tokens];
  } else if (isArray(tokens)) {
    tokenList = <string[]>tokens;
  } else if (isStringMap(tokens)) {
    tokenList = [tokens];
  }
  return new AnimationStepMetadata(tokenList, timing);
}

export function group(steps: AnimationMetadata[]): AnimationGroupMetadata {
  return new AnimationGroupMetadata(steps);
}

export function sequence(steps: AnimationMetadata[]): AnimationSequenceMetadata {
  return new AnimationSequenceMetadata(steps);
}

export function style(tokens: {[key: string]: string|number|boolean}|string|any[]): AnimationStepMetadata {
  return animate(tokens, '0s');
}
