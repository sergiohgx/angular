import {BaseException} from 'angular2/src/facade/exceptions';
import {isString, isPresent, isArray, RegExpWrapper, NumberWrapper} from 'angular2/src/facade/lang';

import {
  AnimationWithStepsMetadata,
  AnimationStepMetadata,
  AnimationGroupMetadata,
  AnimationSequenceMetadata
} from 'angular2/src/core/metadata/animations';

import {AnimationFactory, RuntimeAnimationFactory} from 'angular2/src/compiler/animation/animation_factory';

import {AnimationStyles} from 'angular2/src/animate/worker/animation_styles';
import {AnimationParser} from 'angular2/src/compiler/animation/parser';
import {AnimationAst, AnimationGroupAst, AnimationSequenceAst, AnimationAstVisitor, AnimationStepAst} from 'angular2/src/compiler/animation/animation_ast';

export var ONE_SECOND = 1000;


export function parseTimeExpression(exp: string|number): any[] {
  var duration: number = 0;
  var delay: number = 0;
  var easing: string = null;
  if (isString(exp)) {
    var values = (<string>exp).split(' ');
    var i = 0;

    if (isPresent(values[i])) {
      duration = parseTime(values[i++]);
    }

    // this means that the delay number value was detected
    var next = values.length > 1 ? values[i] : null;
    if (next != null && RegExpWrapper.test(/[0-9]/g, next[0])) {
      i++;
      delay = parseTime(next);
    }

    if (isPresent(values[i])) {
      easing = values[i];
    }
  } else {
    duration = <number>exp;
  }

  return [duration, delay, easing];
}

export function parseTime(time:string): number {
  var value = 0;
  var modifier = 1;
  if (isPresent(time) && time.length > 0) {
    var lastChar = time[time.length - 1];
    var chop = 0;
    if (lastChar == 's') {
      chop++;
      var secondLastChar = time[time.length - 2];
      if (secondLastChar == 'm') {
        chop++;
      } else {
        modifier = ONE_SECOND;
      }
    }
    value = NumberWrapper.parseFloat(time.substring(0, time.length - chop)) * modifier;
  }
  return value;
}

export abstract class AnimationCompiler {
  compileAnimation(metadata: AnimationSequenceMetadata | AnimationGroupMetadata | AnimationStepMetadata, styles: AnimationStyles): AnimationFactory {
    throw new BaseException('NOT IMPLEMENTED');
  }
}

export class RuntimeAnimationCompiler implements AnimationCompiler {
  private _parser = new AnimationParser();

  _parseAnimationNode(entry: any[] | AnimationSequenceMetadata | AnimationGroupMetadata | AnimationStepMetadata, styles: AnimationStyles): AnimationAst {
    if (entry instanceof AnimationStepMetadata) {
      var timings = parseTimeExpression(entry.timings);
      var keyframes = this._parser.normalizeAnimationIntoKeyframes(entry.tokens, styles);
      return new AnimationStepAst(keyframes, timings[0], timings[1], timings[2]);
    }

    var stepData = isArray(entry)
        ? <any[]>entry
        : (<AnimationSequenceMetadata | AnimationGroupMetadata>entry).steps;

    var previousStyleStep: AnimationStepAst;
    var steps: AnimationAst[] = [];
    stepData.forEach((entry) => {
      entry = this._parseAnimationNode(entry, styles);

      var skipStep = false;
      var isStyleStep = false;
      if (entry instanceof AnimationStepAst) {
        var step = <AnimationStepAst>entry;
        isStyleStep = step.duration == 0 && step.delay == 0 && step.keyframes.length == 1;
        if (isStyleStep) {
          if (isPresent(previousStyleStep)) {
            var styleData = step.keyframes[0].styles[0].styles;
            previousStyleStep.keyframes[0].styles[0].addStyles(styleData, false);
            skipStep = true;
          } else {
            previousStyleStep = step;
          }
        }
      }

      if (!isStyleStep) {
        previousStyleStep = null;
      }

      if (!skipStep) {
        steps.push(entry);
      }
    });

    if (entry instanceof AnimationGroupMetadata) {
      return new AnimationGroupAst(steps);
    }

    return new AnimationSequenceAst(steps);
  }

  compileAnimation(metadata: AnimationSequenceMetadata | AnimationGroupMetadata | AnimationStepMetadata, styles: AnimationStyles): AnimationFactory {
    return new RuntimeAnimationFactory(this._parseAnimationNode(metadata, styles));
  }
}
