import {isString, isPresent, isArray, RegExpWrapper, NumberWrapper} from 'angular2/src/facade/lang';
import {StringMapWrapper, ListWrapper} from 'angular2/src/facade/collection';
import {BaseException} from 'angular2/src/facade/exceptions';

import {
  AnimationStepMetadata,
  AnimationGroupMetadata,
  AnimationSequenceMetadata
} from 'angular2/src/core/metadata/animations';

import {AnimationFactory} from 'angular2/src/core/animation/animation_factory';
import {AnimationCompiler} from 'angular2/src/core/animation/animation_compiler';
import {RuntimeAnimationFactory} from 'angular2/src/compiler/animation/animation_factory';

import {parseTimeExpression, parseAnimationIntoKeyframes} from 'angular2/src/compiler/animation/animation_parser';

import {AnimationAst} from 'angular2/src/compiler/animation/animation_ast';
import {TERMINAL_KEYFRAME, INITIAL_KEYFRAME, AnimationKeyframeAst} from 'angular2/src/compiler/animation/animation_keyframe_ast';
import {AnimationKeyframeStylesAst} from 'angular2/src/compiler/animation/animation_keyframe_styles_ast';
import {AnimationSequenceAst} from 'angular2/src/compiler/animation/animation_sequence_ast';
import {AnimationGroupAst} from 'angular2/src/compiler/animation/animation_group_ast';
import {AnimationStepAst} from 'angular2/src/compiler/animation/animation_step_ast';

function squashKeyframeStyles(keyframes: AnimationKeyframeAst[]): AnimationKeyframeStylesAst[] {
  var styles: AnimationKeyframeStylesAst[] = [];
  keyframes.forEach((keyframe: AnimationKeyframeAst) => {
    keyframe.styles.forEach((styleData: AnimationKeyframeStylesAst) => {
      styles.push(new AnimationKeyframeStylesAst(styleData.styles));
    });
  });
  return styles;
}

function retrieveLookupStylesFromKeyframes(lookup: {[key: string]: string}, keyframes: AnimationKeyframeAst[]): {[key: string]: string} {
  var values: {[key: string]: string} = {};
  keyframes.forEach((keyframe: AnimationKeyframeAst) => {
    keyframe.styles.forEach((styleData: AnimationKeyframeStylesAst) => {
      StringMapWrapper.forEach(styleData.styles, (val, prop) => {
        var value = lookup[prop];
        if (!isPresent(value)) {
          throw new BaseException('...');
        }
        values[prop] = value;
      });
    });
  });
  return values;
}

function createInstantAnimationFromKeyframe(styles: AnimationKeyframeStylesAst[]): AnimationStepAst {
  return new AnimationStepAst([
    new AnimationKeyframeAst(INITIAL_KEYFRAME, styles),
    new AnimationKeyframeAst(TERMINAL_KEYFRAME, styles)
  ], 0, 0, '');
}

function normalizeKeyframeStylesFromStartToEnd(styles: {[key: string]: string},
                                          a: AnimationKeyframeAst[],
                                          b: AnimationKeyframeAst[]): AnimationKeyframeStylesAst[] {
  // CASE 1. ensure all styles from A animate to B
  // figure out all properties of A
  // figure out all properties of B
  // put all A properties into an array
  // put all B properties into an array
  // find missing B properties and clone them into the B properties array
  // return the new step with keyframes
  var start: {[key: string]: string} = {};
  a.forEach((keyframe: AnimationKeyframeAst) => {
    keyframe.styles.forEach((styleData: AnimationKeyframeStylesAst) => {
      StringMapWrapper.forEach(styleData.styles, (value, prop) => {
        start[prop] = value;
      });
    });
  });

  var end: {[key: string]: string} = {};
  b.forEach((keyframe: AnimationKeyframeAst) => {
    keyframe.styles.forEach((styleData: AnimationKeyframeStylesAst) => {
      StringMapWrapper.forEach(styleData.styles, (value, prop) => {
        if (!isPresent(start[prop])) {
          var startingValue = styles[prop];
          if (isPresent(startingValue)) {
            start[prop] = startingValue;
          } else {
            throw new BaseException('...');
          }
        }
        end[prop] = value;
      });
    });
  });

  StringMapWrapper.forEach(start, (value, prop) => {
    if (!isPresent(end[prop])) {
      end[prop] = value;
    }
  });

  return [
    new AnimationKeyframeStylesAst(start),
    new AnimationKeyframeStylesAst(end),
  ];
}

function normalizeKeyframeStylesFromEnd(styles: {[key: string]: string},
                                   a: AnimationKeyframeAst[],
                                   b: AnimationKeyframeAst[]): AnimationKeyframeStylesAst[] {
  // CASE 2. only animate intersected styles between A and B
  // figure out all properties of A
  // find intersecting properties of B
  // assert missing A properties (throw if missing)
  // fill missing B properties (clone)
  // return the new step with keyframes
  var lhs: {[key: string]: string} = {};
  a.forEach((keyframe: AnimationKeyframeAst) => {
    keyframe.styles.forEach((styleData: AnimationKeyframeStylesAst) => {
      StringMapWrapper.forEach(styleData.styles, (value, prop) => {
        lhs[prop] = value;
      });
    });
  });

  var rhs: {[key: string]: string} = {};
  b.forEach((keyframe: AnimationKeyframeAst) => {
    keyframe.styles.forEach((styleData: AnimationKeyframeStylesAst) => {
      StringMapWrapper.forEach(styleData.styles, (value, prop) => {
        rhs[prop] = value;
      });
    });
  });

  var start: {[key: string]: string} = {};
  StringMapWrapper.forEach(rhs, (v, prop) => {
    var value = lhs[prop];
    if (!isPresent(value)) {
      value = styles[prop];
      if (!isPresent(value)) {
        throw new BaseException('...');
      }
    }
    start[prop] = value;
  });

  return [
    new AnimationKeyframeStylesAst(start),
    new AnimationKeyframeStylesAst(rhs),
  ];
}

export class RuntimeAnimationCompiler implements AnimationCompiler {
  _parseAnimationNode(entry: any[] | AnimationSequenceMetadata | AnimationGroupMetadata | AnimationStepMetadata, collectedStyles: {[key: string]: string}): AnimationAst {
    if (entry instanceof AnimationStepMetadata) {
      var timings = parseTimeExpression(entry.timings);
      var keyframes = parseAnimationIntoKeyframes(entry.tokens);
      return new AnimationStepAst(keyframes, timings[0], timings[1], timings[2]);
    }

    var stepData = isArray(entry)
        ? <any[]>entry
        : (<AnimationSequenceMetadata | AnimationGroupMetadata>entry).steps;

    var lastKeyframeStylesArray;
    var lastAnimationKeyframe;
    var steps: AnimationAst[] = [];
    stepData.forEach((entry) => {
      if (entry instanceof AnimationStepMetadata) {
        entry = this._parseAnimationNode(entry, collectedStyles);
        var step = <AnimationStepAst>entry;

        // CASE 0: [style() -> style()]
        // this case occurs when a style step is followed by a previous style step
        // or when the first style step is run. We want to concatenate all subsequent
        // style steps together into a single style step such that we have the correct
        // starting keyframe data to pass into the animation player.
        if (step.duration == 0 && step.delay == 0) {
          let flatKeyframes = squashKeyframeStyles(step.keyframes);
          lastKeyframeStylesArray = isPresent(lastKeyframeStylesArray)
              ? ListWrapper.concat(lastKeyframeStylesArray, flatKeyframes)
              : flatKeyframes;

          lastAnimationKeyframe = null;
        } else {
          // CASE 1: [style(), animate() -> group(animate) / sequence(animate)]
          // this is a special case when an inner group/sequence is run and it needs
          // to figure out what the animation styles are for what it's animating towards
          if (!isPresent(lastKeyframeStylesArray) && !isPresent(lastAnimationKeyframe)) {
            let lastMarkedStyles = retrieveLookupStylesFromKeyframes(collectedStyles, entry.keyframes);
            lastKeyframeStylesArray = [new AnimationKeyframeStylesAst(lastMarkedStyles)];
          }

          let normalizedKeyframeStyles;
          if (isPresent(lastKeyframeStylesArray)) {
            // CASE 2: [style(), style() -> animate()]
            // this occurs when one or more style() steps are run before an animation step
            // is fired. We need to normalize the styles so that we animate ALL the style
            // properties that were concatenated beforehand (otherwise the player will complain)
            let lastAnimationStyles = [new AnimationKeyframeAst(INITIAL_KEYFRAME, lastKeyframeStylesArray)];
            normalizedKeyframeStyles = normalizeKeyframeStylesFromStartToEnd(collectedStyles,
                                                                             lastAnimationStyles, step.keyframes)
          } else {
           // CASE 3: [animate() -> animate()]
           // this occurs when one or more style() steps are run before an animation step
           // is fired. We need to normalize the styles so that we animate ALL the style
           // properties that were concatenated beforehand (otherwise the player will complain)
           normalizedKeyframeStyles = normalizeKeyframeStylesFromEnd(collectedStyles,
                                                                     [lastAnimationKeyframe], step.keyframes);
          }

          let normalizedKeyframes = [
            new AnimationKeyframeAst(INITIAL_KEYFRAME, [normalizedKeyframeStyles[0]]),
            new AnimationKeyframeAst(TERMINAL_KEYFRAME, [normalizedKeyframeStyles[1]]),
          ];

          steps.push(
            new AnimationStepAst(normalizedKeyframes, step.duration, step.delay, step.easing)
          );

          lastKeyframeStylesArray = null;
          lastAnimationKeyframe = normalizedKeyframes[1];
        }

        step.keyframes.forEach((keyframe: AnimationKeyframeAst) => {
          keyframe.styles.forEach((styleData: AnimationKeyframeStylesAst) => {
            StringMapWrapper.forEach(styleData.styles, (value, prop) => {
              collectedStyles[prop] = value;
            });
          });
        });
      } else {
        // CASE 4: [style(), style() -> group(animate)/sequence(animate)]
        // This occurs when a series of style steps are run but do not get a chance
        // to animate because an inner group or sequence kicks in. When this occurs
        // we need to create an empty style step which will then apply the collected
        // style data to the element so that it appears on screen (otherwise it is not
        // possible to determine how and when to apply styles to an inner sequence or an
        // inner group since they may have different timing, easing and staggering values
        if (isPresent(lastKeyframeStylesArray)) {
          steps.push(createInstantAnimationFromKeyframe(lastKeyframeStylesArray));
          lastKeyframeStylesArray = null;
        }
        steps.push(this._parseAnimationNode(entry, collectedStyles));
      }
    });

    // CASE 5: [style(), style() -> EOF]
    // This occurs when no animation actually gets run, but a series
    // of style() steps were issued. There is no point in running an
    // animation here when this happens so we do not add the remaining
    // style data to the animation steps.

    if (entry instanceof AnimationGroupMetadata) {
      return new AnimationGroupAst(steps);
    }

    return new AnimationSequenceAst(steps);
  }

  compileAnimation(metadata: any): AnimationFactory {
    metadata = <AnimationSequenceMetadata | AnimationGroupMetadata | AnimationStepMetadata>metadata;
    var startingStyles: {[key: string]: string} = {};
    return new RuntimeAnimationFactory(this._parseAnimationNode(metadata, startingStyles));
  }
}
