import {AnimationAst} from 'angular2/src/compiler/animation/animation_ast';
import {AnimationKeyframeAst} from 'angular2/src/compiler/animation/animation_keyframe_ast';
import {AnimationAstVisitor} from 'angular2/src/compiler/animation/animation_ast_visitor';

export class AnimationStepAst implements AnimationAst {
  constructor(public keyframes: AnimationKeyframeAst[], public duration: number, public delay: number, public easing: string) {}
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationStep(this, context);
  }
}
