import {isNumber, isStringMap, NumberWrapper} from 'angular2/src/facade/lang';
import {AnimationKeyframeStylesAst} from 'angular2/src/compiler/animation/animation_keyframe_styles_ast';
import {AnimationAst} from 'angular2/src/compiler/animation/animation_ast';
import {AnimationAstVisitor} from 'angular2/src/compiler/animation/animation_ast_visitor';
import {BaseException} from 'angular2/src/facade/exceptions';

export const INITIAL_KEYFRAME = 0;
export const TERMINAL_KEYFRAME = 100;

const BASE_TEN = 10;

export class AnimationKeyframeAst implements AnimationAst {
  public position: number = 0;

  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationKeyframe(this, context);
  }

  constructor(position: string|number, public styles: AnimationKeyframeStylesAst[]) {
    if (isNumber(position)) {
      if (position < INITIAL_KEYFRAME || position > TERMINAL_KEYFRAME) {
        throw new BaseException('...');
      }
      this.position = <number>position;
    } else {
      switch (position) {
        case 'from':
          this.position = INITIAL_KEYFRAME;
          break;
        case 'to':
          this.position = TERMINAL_KEYFRAME;
          break;
        default:
          var pos: string = position.toString();
          this.position = NumberWrapper.parseInt(pos.substring(0, pos.indexOf("%")), BASE_TEN);
          break;
      }
    }
  }

  addStyles(styles: {[key: string]: string}): void {
    for (var i = this.styles.length - 1; i >= 0; i--) {
      let entry = this.styles[i];
      if (isStringMap(entry.styles)) {
        entry.addStyles(styles);
        break;
      }
    }
  }
}
