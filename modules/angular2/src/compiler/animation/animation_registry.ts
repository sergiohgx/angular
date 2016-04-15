import {AnimationAst} from 'angular2/src/compiler/animation/animation_ast';
import {AnimationFactory} from 'angular2/src/compiler/animation/animation_factory';

export class AnimationRegistry {
  private _registry = new Map<string, _AnimationBuilder>();

  constructor(animations: Map<string, AnimationAst>) {

  }

  resolveAnimation(key:string, currentState:string, previousState:string) {
    var event = 'someEvent'; // TODO (matsko): resolve
    var animation = this._animations.get(event);
    if (isPresent(animation)) {
    }
  }
}
