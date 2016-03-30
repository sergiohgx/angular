import {StringMapWrapper} from 'angular2/src/facade/collection';
import {AnimationAst} from 'angular2/src/compiler/animation/animation_ast';
import {AnimationAstVisitor} from 'angular2/src/compiler/animation/animation_ast_visitor';

export class AnimationKeyframeStylesAst implements AnimationAst {
  constructor(public styles: {[key: string]: string}) {}

  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationKeyframeStyles(this, context);
  }

  addStyles(styles: {[key: string]: string}, override: boolean = false): void {
    this.styles = override
        ? StringMapWrapper.merge(styles, this.styles)
        : StringMapWrapper.merge(this.styles, styles);
  }
}

