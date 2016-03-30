import {isStringMap} from 'angular2/src/facade/lang';
import {AnimationKeyframeStylesAst} from 'angular2/src/compiler/animation/animation_keyframe_styles_ast';
import {AnimationAst} from 'angular2/src/compiler/animation/animation_ast';
import {AnimationAstVisitor} from 'angular2/src/compiler/animation/animation_ast_visitor';

export var INITIAL_KEYFRAME = 0;
export var TERMINAL_KEYFRAME = 100;

export class AnimationKeyframeAst implements AnimationAst {
  public position: number = 0;

  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationKeyframe(this, context);
  }

  constructor(position: string|number, public styles: AnimationKeyframeStylesAst[]) {
    switch (position) {
      case INITIAL_KEYFRAME:
      case 'from':
        this.position = INITIAL_KEYFRAME;
        break;
      case TERMINAL_KEYFRAME:
      case 'to':
        this.position = TERMINAL_KEYFRAME;
        break;
      default:
        var pos: string = position.toString();
        this.position = parseInt(pos.substring(0, pos.indexOf("%")));
        break;
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
