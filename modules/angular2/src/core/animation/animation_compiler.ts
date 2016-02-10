import {AnimationFactory} from 'angular2/src/core/animation/animation_factory';
import {BaseException} from 'angular2/src/facade/exceptions';
import {Map} from 'angular2/src/facade/collection';
import {AnimationMetadata} from 'angular2/src/core/metadata/animations';

export abstract class AnimationCompiler {
  compileAnimations(animationDetails: {[key: string]: AnimationMetadata}): AnimationFactory {
    throw new BaseException('NOT IMPLEMENTED');
  }
}
