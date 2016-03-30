import {AnimationAst} from 'angular2/src/compiler/animation/animation_ast';
import {AnimationAstVisitor} from 'angular2/src/compiler/animation/animation_ast_visitor';

export class AnimationSequenceAst implements AnimationAst {
  constructor(private _steps: AnimationAst[]) {}
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationSequence(this, context);
  }
  get steps() {
    return this._steps;
  }
}

