import {AnimationKeyframeAst} from 'angular2/src/compiler/animation/animation_keyframe_ast';
import {AnimationKeyframeStylesAst} from 'angular2/src/compiler/animation/animation_keyframe_styles_ast';
import {AnimationSequenceAst} from 'angular2/src/compiler/animation/animation_sequence_ast';
import {AnimationGroupAst} from 'angular2/src/compiler/animation/animation_group_ast';
import {AnimationStepAst} from 'angular2/src/compiler/animation/animation_step_ast';

export interface AnimationAstVisitor {
  visitAnimationStep(ast: AnimationStepAst, context: any): any;
  visitAnimationSequence(ast: AnimationSequenceAst, context: any): any;
  visitAnimationGroup(ast: AnimationGroupAst, context: any): any;
  visitAnimationKeyframe(ast: AnimationKeyframeAst, context: any): any;
  visitAnimationKeyframeStyles(ast: AnimationKeyframeStylesAst, context: any): any;
}
