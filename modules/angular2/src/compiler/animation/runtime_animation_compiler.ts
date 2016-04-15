import {BaseException} from 'angular2/src/facade/exceptions';

import {AnimationMetadata} from 'angular2/src/core/metadata/animations';
import {ListWrapper, Map, StringMapWrapper} from 'angular2/src/facade/collection';

import {AnimationRegistry} from 'angular2/src/compiler/animation/animation_registry';
import {AnimationAst} from 'angular2/src/compiler/animation/animation_ast';
import {AnimationEvent} from 'angular2/src/compiler/animation/animation_event';
import {RuntimeAnimationFactory} from 'angular2/src/compiler/animation/runtime_animation_factory';

import {
  AnimationParseError,
  parseAnimationEvent,
  parseAnimationMetadata,
  ParsedAnimationResult,
} from 'angular2/src/compiler/animation/animation_parser';

export class RuntimeAnimationCompiler {
  compileAnimationRegistry(animationDetails: {[key: string]: AnimationMetadata}): AnimationRegistry {
    var parsedAnimations = new Map<string, AnimationAst>();
    StringMapWrapper.forEach(animationDetails, (metadata, event) => {
      var animationResults = parseAnimationMetadata(metadata);
      var errors: AnimationParseError[] =
          ListWrapper.concat(eventResults.errors, animationResults.errors);
      if (errors.length > 0) {
        var errorMessage = '';
        errors.forEach((error: AnimationParseError) => { errorMessage += "\n- " + error.msg; });
        throw new BaseException(
            `Unable to parse the animation sequence for "${event}" due to the following errors: ` +
            errorMessage);
      }
      parsedAnimations.set(event, animationResults.ast);
    });
    return new AnimationRegistry(parsedAnimations);
  }
}
