import {AnimationPlayer, AnimationGroupPlayer, AnimationSequencePlayer} from 'angular2/src/core/animation/animation_player';
import {AnimationAst, AnimationGroupAst, AnimationSequenceAst, AnimationAstVisitor, AnimationStepAst} from 'angular2/src/compiler/animation/animation_ast';

export interface AnimationFactory {
  create(element: any, renderer: any): AnimationPlayer;
}

export class RuntimeAnimationFactory implements AnimationFactory {
  private _builder: _AnimationBuilder;
  constructor(ast) {
    this._builder = new _AnimationBuilder(ast);
  }
  create(element: any, renderer: any): AnimationPlayer {
    return this._builder.build(new _AnimationFactoryContext(element, renderer));
  }
}

class _AnimationFactoryContext {
  constructor(public element: any, public renderer: any) {}
}

class _AnimationBuilder implements AnimationAstVisitor {
  constructor(private _ast: AnimationAst) {}

  visitAnimationStep(ast: AnimationStepAst, context: _AnimationFactoryContext): AnimationPlayer {
    // TODO (matsko): fix this later once we have multi-platform support
    return context.renderer['animate'](context.element, ast.keyframes, ast.duration, ast.delay, ast.easing);
  }

  visitAnimationSequence(ast: AnimationSequenceAst, context: _AnimationFactoryContext): AnimationPlayer {
    var players = ast.steps.map(step => step.visit(this, context));
    return new AnimationSequencePlayer(players);
  }

  visitAnimationGroup(ast: AnimationGroupAst, context: _AnimationFactoryContext): AnimationPlayer {
    var players = ast.steps.map(step => step.visit(this, context));
    return new AnimationGroupPlayer(players);
  }

  build(context: _AnimationFactoryContext): AnimationPlayer {
    return this._ast.visit(this, context);
  }
}
