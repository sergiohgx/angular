import {AnimationFactory} from 'angular2/src/core/animation/animation_factory';
import {BaseException} from 'angular2/src/facade/exceptions';

export abstract class AnimationCompiler {
  compileAnimation(metadata: any): AnimationFactory {
    throw new BaseException('NOT IMPLEMENTED');
  }
}
