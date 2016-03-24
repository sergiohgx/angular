import {BaseException} from 'angular2/src/facade/exceptions';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';

export interface AnimationAstVisitor {
  visitAnimationStep(ast: AnimationStepAst, context: any): any;
  visitAnimationSequence(ast: AnimationSequenceAst, context: any): any;
  visitAnimationGroup(ast: AnimationGroupAst, context: any): any;
}

export interface AnimationAst {
  visit(visitor: AnimationAstVisitor, context: any): any;
}

export class AnimationStepAst implements AnimationAst {
  constructor(public keyframes: AnimationKeyframe[], public duration: number, public delay: number, public easing: string) {}
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationStep(this, context);
  }
}

export abstract class AnimationWithStepsAst {
  get steps(): AnimationAst[] {
    throw new BaseException('NOT IMPLEMENTED');
  }
}

export class AnimationSequenceAst extends AnimationWithStepsAst implements AnimationAst {
  constructor(private _steps: AnimationAst[]) { super(); }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationSequence(this, context);
  }
  get steps() {
    return this._steps;
  }
}

export class AnimationGroupAst extends AnimationWithStepsAst implements AnimationAst {
  constructor(private _steps: AnimationAst[]) { super(); }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationGroup(this, context);
  }
  get steps() {
    return this._steps;
  }
}
