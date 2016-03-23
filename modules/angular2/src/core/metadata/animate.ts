import {CONST} from 'angular2/src/facade/lang';

export abstract class AnimationMetadata {}

@CONST()
export class AnimationStepMetadata extends AnimationMetadata {
  constructor(public tokens: any[], public timings: string|number) { super(); }
}

@CONST()
export class AnimationStepsMetadata extends AnimationMetadata {
  constructor(public steps: AnimationMetadata[]) { super(); }
}

@CONST()
export class AnimationSequenceMetadata extends AnimationStepsMetadata {
  constructor(steps: AnimationMetadata[]) { super(steps); }
}

@CONST()
export class AnimationGroupMetadata extends AnimationStepsMetadata {
  constructor(steps: AnimationMetadata[]) { super(steps); }
}
