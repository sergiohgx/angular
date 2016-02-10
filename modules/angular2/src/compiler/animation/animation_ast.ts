export abstract class AnimationAst {
  public startTime: number = 0;
  public playTime: number = 0;
  abstract visit(visitor: AnimationAstVisitor, context: any): any;
}

export interface AnimationAstVisitor {
  visitAnimationStyleStep(ast: AnimationStyleStepAst, context: any): any;
  visitAnimationAnimateStep(ast: AnimationAnimateStepAst, context: any): any;
  visitAnimationSequence(ast: AnimationSequenceAst, context: any): any;
  visitAnimationGroup(ast: AnimationGroupAst, context: any): any;
  visitAnimationKeyframe(ast: AnimationKeyframeAst, context: any): any;
  visitAnimationKeyframeStyles(ast: AnimationKeyframeStylesAst, context: any): any;
}

export class AnimationAnimateStepAst extends AnimationAst {
  constructor(public keyframes: AnimationKeyframeAst[], public duration: number,
              public delay: number, public easing: string) {
    super();
  }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationAnimateStep(this, context);
  }
}

export class AnimationStyleStepAst extends AnimationAst {
  constructor(public keyframe: AnimationKeyframeAst) { super(); }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationStyleStep(this, context);
  }
}

export class AnimationKeyframeStylesAst extends AnimationAst {
  constructor(public styles: {[key: string]: string | number}) { super(); }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationKeyframeStyles(this, context);
  }
}

export class AnimationKeyframeAst extends AnimationAst {
  constructor(public position: number, public styles: AnimationKeyframeStylesAst[]) { super(); }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationKeyframe(this, context);
  }
}

export abstract class AnimationWithStepsAst extends AnimationAst {
  constructor(public steps: AnimationAst[]) { super(); }
}

export class AnimationGroupAst extends AnimationWithStepsAst {
  constructor(steps: AnimationAst[]) { super(steps); }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationGroup(this, context);
  }
}

export class AnimationSequenceAst extends AnimationWithStepsAst {
  constructor(steps: AnimationAst[]) { super(steps); }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationSequence(this, context);
  }
}
