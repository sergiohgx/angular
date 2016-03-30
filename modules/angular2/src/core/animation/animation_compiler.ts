import {AnimationFactory} from 'angular2/src/core/animation/animation_factory';
import {BaseException} from 'angular2/src/facade/exceptions';
import {
  AnimationWithStepsMetadata,
  AnimationStepMetadata,
  AnimationGroupMetadata,
  AnimationSequenceMetadata
} from 'angular2/src/core/metadata/animations';

export abstract class AnimationCompiler {
  compileAnimation(metadata: AnimationSequenceMetadata | AnimationGroupMetadata | AnimationStepMetadata): AnimationFactory {
    throw new BaseException('NOT IMPLEMENTED');
  }
}
