import {StringMapWrapper} from 'angular2/src/facade/collection';
import {Math} from 'angular2/src/facade/math';
import {
  IS_DART,
  RegExpWrapper,
  isArray,
  isPresent,
  isBlank,
  isNumber,
  isString,
  isStringMap,
  NumberWrapper
} from 'angular2/src/facade/lang';

import {
  ENTER,
  LEAVE,
  ADD_CLASS,
  REMOVE_CLASS,
  SET_ATTRIBUTE,
  REMOVE_ATTRIBUTE,
  AnimationMetadata,
  AnimationWithStepsMetadata,
  AnimationStyleMetadata,
  AnimationAnimateMetadata,
  AnimationGroupMetadata,
  AnimationSequenceMetadata
} from 'angular2/src/core/metadata/animations';

import {
  AnimationAst,
  AnimationKeyframeAst,
  AnimationKeyframeStylesAst,
  AnimationWithStepsAst,
  AnimationSequenceAst,
  AnimationGroupAst,
  AnimationStyleStepAst,
  AnimationAnimateStepAst
} from 'angular2/src/compiler/animation/animation_ast';

import {
  AnimationEvent,
  EnterAnimationEvent,
  LeaveAnimationEvent,
  AddClassAnimationEvent,
  RemoveClassAnimationEvent,
  SetAttributeAnimationEvent,
  RemoveAttributeAnimationEvent
} from 'angular2/src/compiler/animation/animation_event';

import {StylesCollection} from "angular2/src/compiler/animation/styles_collection";

import {ParseError} from "angular2/src/compiler/parse_util";

const _BASE_TEN = 10;
const _INITIAL_KEYFRAME = 0;
const _TERMINAL_KEYFRAME = 100;
const _ONE_SECOND = 1000;

export class AnimationParseError extends ParseError {
  constructor(message) { super(null, message); }
  toString(): string { return `${this.msg}`; }
}

export class ParsedAnimationResult {
  constructor(public ast: AnimationAst, public errors: AnimationParseError[]) {}
}

export class ParsedEventResult {
  constructor(public event: AnimationEvent, public errors: AnimationParseError[]) {}
}

export function parseAnimationMetadata(entry: AnimationMetadata |
                                       AnimationMetadata[]): ParsedAnimationResult {
  var styles = new StylesCollection();
  var errors: AnimationParseError[] = [];
  var metadata = _squashSiblingStyles(entry, errors);
  var ast = _parseAnimationMetadataEntry(metadata, 0, styles, errors);
  if (errors.length == 0) {
    _fillAnimationAstStartingKeyframes(ast, styles, errors);
  }
  return new ParsedAnimationResult(ast, errors);
}

var animationEventRegex = /^(\w+)\((.+?)\)$/g;
export function parseAnimationEvent(name: string): ParsedEventResult {
  var errors: AnimationParseError[] = [];
  var eventName = name;
  var keyParam = null;
  var valueParam = null;
  var totalEventParams = 0;
  var matches = RegExpWrapper.firstMatch(animationEventRegex, name);
  if (isPresent(matches)) {
    eventName = matches[1];
    var paramStr = matches[2];
    var splitIndex = paramStr.indexOf('=');
    if (splitIndex > 0) {
      keyParam = paramStr.substring(0, splitIndex);
      valueParam = _checkAndStripQuotes(paramStr.substring(splitIndex + 1), errors);
      totalEventParams = 2;
    } else {
      keyParam = paramStr;
      totalEventParams = 1;
    }
  }

  var animationEvent = null;
  var maxEventParams = 0;
  switch (eventName) {
    case ENTER:
      animationEvent = new EnterAnimationEvent();
      break;
    case LEAVE:
      animationEvent = new LeaveAnimationEvent();
      break;
    case ADD_CLASS:
      animationEvent = new AddClassAnimationEvent(keyParam);
      maxEventParams = 1;
      break;
    case REMOVE_CLASS:
      animationEvent = new RemoveClassAnimationEvent(keyParam);
      maxEventParams = 1;
      break;
    case REMOVE_ATTRIBUTE:
      animationEvent = new RemoveAttributeAnimationEvent(keyParam);
      maxEventParams = 1;
      break;
    case SET_ATTRIBUTE:
      animationEvent = new SetAttributeAnimationEvent(keyParam, valueParam);
      maxEventParams = 2;
      break;
    default:
      errors.push(new AnimationParseError(
          `The animation event name "${name}" is not a supported animation`));
      break;
  }
  if (totalEventParams > maxEventParams) {
    var errorMessage = totalEventParams > 1 ?
                           `${eventName} is not allowed to take in more then one event parameters` :
                           `${eventName} is not allowed to take in any event parameters`;
    errors.push(new AnimationParseError(errorMessage));
  }
  return new ParsedEventResult(animationEvent, errors);
}

function _checkAndStripQuotes(value: string, errors: AnimationParseError[]): string {
  var DQ = '"';
  var SQ = "'";
  var firstVal = value[0];
  if (firstVal == DQ || firstVal == SQ) {
    var lastVal = value[value.length - 1];
    if (lastVal == firstVal) {
      value = value.substring(1, value.length - 1);
    } else {
      errors.push(new AnimationParseError(`Unbalanced string value " ${value} " detected`));
      value = value.substring(1);
    }
  }
  return value;
}

function _squashSiblingStyles(entry: AnimationMetadata | AnimationMetadata[],
                              errors: AnimationParseError[]): AnimationMetadata {
  var squashedEntries = _squashSiblingStylesEntry(entry, errors);
  return squashedEntries.length > 1 ? new AnimationSequenceMetadata(squashedEntries) :
                                      squashedEntries[0];
}

function _squashSiblingStylesEntry(entry: AnimationMetadata | AnimationAnimateMetadata[],
                                   errors: AnimationParseError[]): AnimationMetadata[] {
  var steps: AnimationMetadata[];
  if (isArray(entry)) {
    steps = <AnimationMetadata[]>entry;
  } else if (entry instanceof AnimationWithStepsMetadata) {
    steps = entry.steps;
  } else {
    // this handles a situation where an animation only has one step
    return [entry];
  }

  var newSteps: AnimationMetadata[] = [];
  var combinedStyles: {[key: string]: string | number};
  steps.forEach(step => {
    if (step instanceof AnimationStyleMetadata) {
      // this occurs when a style step is followed by a previous style step
      // or when the first style step is run. We want to concatenate all subsequent
      // style steps together into a single style step such that we have the correct
      // starting keyframe data to pass into the animation player.
      if (!isPresent(combinedStyles)) {
        combinedStyles = {};
      }
      var stepStyle = (<AnimationStyleMetadata>step).style;
      combinedStyles = StringMapWrapper.merge(combinedStyles, stepStyle);
    } else {
      // it is important that we create a metadata entry of the combined styles
      // before we go on an process the animate, sequence or group metadata steps.
      // This will ensure that the AST will have the previous styles painted on
      // screen before any further animations that use the styles take place.
      if (isPresent(combinedStyles)) {
        newSteps.push(new AnimationStyleMetadata(combinedStyles));
        combinedStyles = null;
      }

      if (step instanceof AnimationWithStepsMetadata) {
        let innerSteps = _squashSiblingStylesEntry(step, errors);
        step = step instanceof AnimationGroupMetadata ? new AnimationGroupMetadata(innerSteps) :
                                                        new AnimationSequenceMetadata(innerSteps);
      }
      newSteps.push(step);
    }
  });

  // this happens when only styles were animated within the sequence
  if (isPresent(combinedStyles)) {
    errors.push(new AnimationParseError('One or more pending style(...) animations remain'));
    newSteps.push(new AnimationStyleMetadata(combinedStyles));
  }

  return newSteps;
}

class _AnimationTimings {
  constructor(public duration: number, public delay: number, public easing: string) {}
}

function _parseAnimationMetadataEntry(entry: AnimationMetadata, currentTime: number,
                                      collectedStyles: StylesCollection,
                                      errors: AnimationParseError[]): AnimationAst {
  var ast;
  var playTime = 0;
  var startingTime = currentTime;
  if (entry instanceof AnimationWithStepsMetadata) {
    var maxDuration = 0;
    var steps = [];
    var isGroup = entry instanceof AnimationGroupMetadata;
    entry.steps.forEach(entry => {
      var innerAst = _parseAnimationMetadataEntry(entry, isGroup ? startingTime : currentTime,
                                                  collectedStyles, errors);
      var astDuration = innerAst.playTime;
      currentTime += astDuration;
      playTime += astDuration;
      maxDuration = Math.max(astDuration, maxDuration);
      steps.push(innerAst);
    });
    if (isGroup) {
      ast = new AnimationGroupAst(steps);
      playTime = maxDuration;
      currentTime = startingTime + playTime;
    } else {
      ast = new AnimationSequenceAst(steps);
    }
  } else {
    var styles = [];
    if (entry instanceof AnimationStyleMetadata) {
      styles.push(entry.style);
    } else if (entry instanceof AnimationAnimateMetadata) {
      styles = entry.styles;
    }
    var currentKeyframe = _parseStepMetadataIntoKeyframe(styles, errors);
    if (entry instanceof AnimationAnimateMetadata) {
      var timings = _parseTimeExpression(entry.timings, errors);
      ast = new AnimationAnimateStepAst([currentKeyframe], timings.duration, timings.delay,
                                        timings.easing);
      playTime = timings.duration + timings.delay;
      currentTime += playTime;
    } else {
      ast = new AnimationStyleStepAst(currentKeyframe);
    }
    styles.forEach((entry: {[key: string]: string | number}) => {
      if (isPresent(entry)) {
        StringMapWrapper.forEach(
            entry, (value, prop) => { collectedStyles.insertAtTime(prop, currentTime, value); });
      }
    });
  }

  ast.playTime = playTime;
  ast.startTime = startingTime;
  return ast;
}

function _fillAnimationAstStartingKeyframes(ast: AnimationAst, collectedStyles: StylesCollection,
                                            errors: AnimationParseError[]): void {
  if (ast instanceof AnimationAnimateStepAst) {
    var endKeyframe = ast.keyframes[0];
    var startKeyframe = _createStartKeyframeFromEndKeyframe(endKeyframe, ast.startTime,
                                                            ast.playTime, collectedStyles, errors);
    ast.keyframes = [startKeyframe, endKeyframe];
  } else if (ast instanceof AnimationWithStepsAst) {
    ast.steps.forEach(entry => _fillAnimationAstStartingKeyframes(entry, collectedStyles, errors));
  }
}

function _parseTimeExpression(exp: string | number,
                              errors: AnimationParseError[]): _AnimationTimings {
  var regex = /^([\.\d]+)(m?s)(?:\s+([\.\d]+)(m?s))?(?:\s+([-a-z]+))?/gi;
  var duration: number;
  var delay: number = 0;
  var easing: string = null;
  if (isString(exp)) {
    var matches = RegExpWrapper.firstMatch(regex, <string>exp);
    if (!isPresent(matches)) {
      errors.push(new AnimationParseError(`The provided timing value "${exp}" is invalid.`));
      return new _AnimationTimings(0, 0, null);
    }

    var durationMatch = NumberWrapper.parseFloat(matches[1]);
    var durationUnit = matches[2];
    if (durationUnit == 's') {
      durationMatch *= _ONE_SECOND;
    }
    duration = Math.floor(durationMatch);

    var delayMatch = matches[3];
    var delayUnit = matches[4];
    if (isPresent(delayMatch)) {
      var delayVal: number = NumberWrapper.parseFloat(delayMatch);
      if (isPresent(delayUnit) && delayUnit == 's') {
        delayVal *= _ONE_SECOND;
      }
      delay = Math.floor(delayVal);
    }

    var easingVal = matches[5];
    if (!isBlank(easingVal)) {
      easing = easingVal;
    }
  } else {
    duration = <number>exp;
  }

  return new _AnimationTimings(duration, delay, easing);
}

function _parseStepMetadataIntoKeyframe(styles: { [key: string]: string | number }[],
                                        errors: AnimationParseError[]): AnimationKeyframeAst {
  var normalizedStyles: {[key: string]: string} = {};
  styles.forEach((token: {[key: string]: string | number}) => {

    if (isStringMap(token)) {
      StringMapWrapper.forEach(token, (value, prop) => { normalizedStyles[prop] = value; });
    } else {
      errors.push(new AnimationParseError(`"${token}" is not a valid key/value style object`));
    }
  });

  return new AnimationKeyframeAst(_TERMINAL_KEYFRAME,
                                  [new AnimationKeyframeStylesAst(normalizedStyles)]);
}

function _createStartKeyframeFromEndKeyframe(endKeyframe: AnimationKeyframeAst, startTime: number,
                                             duration: number, collectedStyles: StylesCollection,
                                             errors: AnimationParseError[]): AnimationKeyframeAst {
  var values: {[key: string]: string | number} = {};
  var endTime = startTime + duration;
  endKeyframe.styles.forEach((styleData: AnimationKeyframeStylesAst) => {
    StringMapWrapper.forEach(styleData.styles, (val, prop) => {
      var resultIndex = collectedStyles.indexOfAtOrBeforeTime(prop, startTime);
      var resultEntry, nextEntry, value;
      if (!isPresent(resultIndex)) {
        errors.push(new AnimationParseError(
            `The CSS style:value entry "${prop}:${val}" cannot be animated because "${prop}" has not been styled within a previous style step`));
        value = null;
      } else {
        resultEntry = collectedStyles.getByIndex(prop, resultIndex);
        value = resultEntry.value;
        nextEntry = collectedStyles.getByIndex(prop, resultIndex + 1);
      }

      if (isPresent(nextEntry) && !nextEntry.matches(endTime, val)) {
        errors.push(new AnimationParseError(
            `The animated CSS property "${prop}" unexpectedly changes between steps "${resultEntry.time}ms" and "${endTime}ms" at "${nextEntry.time}ms"`));
      }

      values[prop] = value;
    });
  });
  return new AnimationKeyframeAst(_INITIAL_KEYFRAME, [new AnimationKeyframeStylesAst(values)]);
}
