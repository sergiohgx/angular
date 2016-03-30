import {AnimationAst} from 'angular2/src/compiler/animation/animation_ast';
import {AnimationAstVisitor} from 'angular2/src/compiler/animation/animation_ast_visitor';

export class AnimationGroupAst implements AnimationAst {
  constructor(private _steps: AnimationAst[]) {}
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationGroup(this, context);
  }
  get steps() {
    return this._steps;
  }
}
