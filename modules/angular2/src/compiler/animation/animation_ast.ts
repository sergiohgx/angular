import {AnimationAstVisitor} from 'angular2/src/compiler/animation/animation_ast_visitor';

export interface AnimationAst {
  visit(visitor: AnimationAstVisitor, context: any): any;
}
