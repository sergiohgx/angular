import {BaseException} from 'angular2/src/facade/exceptions';

import {AnimationMetadata} from 'angular2/src/core/metadata/animations';
import {ListWrapper, Map, StringMapWrapper} from 'angular2/src/facade/collection';

import {AnimationFactory} from 'angular2/src/core/animation/animation_factory';
import {AnimationCompiler} from 'angular2/src/core/animation/animation_compiler';
import {AnimationAst} from 'angular2/src/compiler/animation/animation_ast';
import {AnimationEvent} from 'angular2/src/compiler/animation/animation_event';
import {RuntimeAnimationFactory} from 'angular2/src/compiler/animation/runtime_animation_factory';

import {
  AnimationParseError,
  parseAnimationEvent,
  parseAnimationMetadata,
  ParsedAnimationResult,
} from 'angular2/src/compiler/animation/animation_parser';

export class RuntimeAnimationCompiler implements AnimationCompiler {
  compileAnimations(animationDetails: {[key: string]: AnimationMetadata}): AnimationFactory {
    var parsedAnimations = new Map<AnimationEvent, AnimationAst>();
    StringMapWrapper.forEach(animationDetails, (metadata, event) => {
      var eventResults = parseAnimationEvent(event);
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
      parsedAnimations.set(eventResults.event, animationResults.ast);
    });
    return new RuntimeAnimationFactory(parsedAnimations);
  }
}
