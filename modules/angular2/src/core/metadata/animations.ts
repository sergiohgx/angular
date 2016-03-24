import {isArray, isString, isStringMap} from 'angular2/src/facade/lang';
import {BaseException} from 'angular2/src/facade/exceptions';
import {CONST} from 'angular2/src/facade/lang';

@CONST()
export class AnimationStepMetadata {
  constructor(public tokens: any[], public timings: string|number) {}
}

@CONST()
export abstract class AnimationWithStepsMetadata {
  get steps(): Array<AnimationSequenceMetadata | AnimationGroupMetadata | AnimationStepMetadata> {
    throw new BaseException('NOT IMPLEMENTED: Base Class');
  }
}

@CONST()
export class AnimationSequenceMetadata implements AnimationWithStepsMetadata {
  constructor(private _steps: Array<AnimationSequenceMetadata | AnimationGroupMetadata | AnimationStepMetadata>) {}
  get steps(): Array<AnimationSequenceMetadata | AnimationGroupMetadata | AnimationStepMetadata> {
    return this._steps;
  }
}

@CONST()
export class AnimationGroupMetadata implements AnimationWithStepsMetadata {
  constructor(private _steps: Array<AnimationSequenceMetadata | AnimationGroupMetadata | AnimationStepMetadata>) {}
  get steps(): Array<AnimationSequenceMetadata | AnimationGroupMetadata | AnimationStepMetadata> {
    return this._steps;
  }
}

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

export function group(steps: Array<AnimationSequenceMetadata | AnimationGroupMetadata | AnimationStepMetadata>): AnimationGroupMetadata {
  return new AnimationGroupMetadata(steps);
}

export function sequence(steps: Array<AnimationSequenceMetadata | AnimationGroupMetadata | AnimationStepMetadata>): AnimationSequenceMetadata {
  return new AnimationSequenceMetadata(steps);
}

export function style(tokens: {[key: string]: string|number|boolean}|string|any[]): AnimationStepMetadata {
  return animate(tokens, '0s');
}
