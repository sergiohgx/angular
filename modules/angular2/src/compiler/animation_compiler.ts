import {BaseException} from 'angular2/src/facade/exceptions';

import {isNumber, isString, isStringMap, isPresent, RegExpWrapper, NumberWrapper} from 'angular2/src/facade/lang';
import {StringMapWrapper, ListWrapper} from 'angular2/src/facade/collection';

import {
  AnimationMetadata,
  AnimationStepsMetadata,
  AnimationStepMetadata,
  AnimationGroupMetadata,
  AnimationSequenceMetadata
} from 'angular2/src/core/metadata/animate';

import {Renderer} from 'angular2/src/core/render/api';

import {AnimationStyles} from 'angular2/src/animate/worker/animation_styles';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';
import {AnimationPlayer, AnimationGroupPlayer, AnimationSequencePlayer} from 'angular2/src/animate/animation_player';

export var ONE_SECOND = 1000;

export function parseTimeExpression(exp: string|number): any[] {
  var duration: number = null;
  var delay: number = null;
  var easing: string = null;
  if (isString(exp)) {
    var values = (<string>exp).split(' ');
    var i = 0;

    if (isPresent(values[i])) {
      duration = parseTime(values[i++]);
    }

    // this means that the delay number value was detected
    var next = values.length > 1 ? values[i] : null;
    if (next != null && RegExpWrapper.test(/[0-9]/, next[0])) {
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

export interface AnimationASTVisitor {
  visitAnimationStep(ast: AnimationStepAST, context?: any): void;
  visitAnimationSequence(ast: AnimationSequenceAST, context?: any): void;
  visitAnimationGroup(ast: AnimationGroupAST, context?: any): void;
}

export class AnimationCompiler {
  constructor() {}

  _resolveDefaultPropertyMeasurement(prop): string {
    switch (prop) {
      case 'width':
      case 'height':
      case 'min-width':
      case 'min-height':
      case 'max-width':
      case 'max-height':
      case 'left':
      case 'top':
      case 'bottom':
      case 'right':
      case 'font-size':
      case 'outline-width':
      case 'outline-offset':
      case 'padding-top':
      case 'padding-left':
      case 'padding-bottom':
      case 'padding-right':
      case 'margin-top':
      case 'margin-left':
      case 'margin-bottom':
      case 'margin-right':
      case 'border-radius':
      case 'border-width':
      case 'border-top-width':
      case 'border-left-width':
      case 'border-right-width':
      case 'border-bottom-width':
      case 'text-indent':
        return 'px';

      default:
        return '';
    }
  }

  _normalizeAnimationKeyframes(tokens: any[], styles: AnimationStyles): AnimationKeyframe[] {
    var INITIAL_KEYFRAME = '0%';
    var TERMINAL_KEYFRAME = '100%';

    var keyframes = [];
    tokens.forEach((token: any) => {

      var values: AnimationKeyframe[];
      if (isString(token)) {
        switch (token[0]) {
          case '.':
            values = [styles.lookupClass(token)];
            break;

          case '@':
            values = styles.lookupKeyframe(token);
            break;
        }
      } else if (isStringMap(token)) {
        var normalizedStyles: {[key: string]: string} = {};
        StringMapWrapper.forEach(token, (value, prop) => {
          var measurement = isNumber(value) ? this._resolveDefaultPropertyMeasurement(prop) : '';
          normalizedStyles[prop] = value.toString() + measurement;
        });

        values = [new AnimationKeyframe(TERMINAL_KEYFRAME, normalizedStyles)];
      } else {
        // TODO (matsko): throw proper error
        throw new BaseException('...');
      }

      values.forEach((keyframe: AnimationKeyframe) => {
        var position = keyframe.position;
        var styles = keyframe.styles;

        var compareValue;
        if (position == 'to') {
          position = keyframe.position = TERMINAL_KEYFRAME;
          compareValue = 100;
        } else if (position == 'from') {
          position = keyframe.position = INITIAL_KEYFRAME;
          compareValue = 0;
        } else {
          let pos = position;
          if (pos[pos.length - 1] == "%") {
            pos = pos.substring(0, pos.indexOf("%"));
          }
          compareValue = NumberWrapper.parseInt(pos, 10);
        }

        var data = {
          'compare': compareValue,
          'keyframe': keyframe
        };

        var valueUpdated = false;
        if (keyframes.length > 0) {
          for (var i = 0; i < keyframes.length; i++) {
            let next = keyframes[i];
            let nextCmp = <number>next['compare'];
            let nextKeyframe = <AnimationKeyframe>next['keyframe'];
            if (compareValue <= nextCmp) {
              if (compareValue == nextCmp) {
                nextKeyframe.merge(styles);
              } else {
                ListWrapper.insert(keyframes, i, data);
              }
              valueUpdated = true;
              break;
            }
          }
        }

        if (!valueUpdated) {
          keyframes.push(data);
        }
      });
    });

    return keyframes.map((entry) => entry['keyframe']);
  }

  _parseAnimationNode(entry: AnimationMetadata, styles: AnimationStyles): AnimationAST {
    if (entry instanceof AnimationStepMetadata) {
      var timings = parseTimeExpression(entry.timings);
      var keyframes = this._normalizeAnimationKeyframes(entry.tokens, styles);
      return new AnimationStepAST(keyframes, timings[0], timings[1], timings[2]);
    }

    var steps: AnimationAST[] = (<AnimationStepsMetadata>entry).steps.map((step) => this._parseAnimationNode(step, styles));

    if (entry instanceof AnimationSequenceMetadata) {
      return new AnimationSequenceAST(steps);
    }

    if (entry instanceof AnimationGroupMetadata) {
      return new AnimationGroupAST(steps);
    }
  }

  compileAnimation(metadata: AnimationMetadata, styles: AnimationStyles): AnimationFactory {
    return new AnimationFactory(this._parseAnimationNode(metadata, styles));
  }
}

export class AnimationFactoryContext {
  constructor(public element: Node, public renderer: Renderer, public index: number, public players: AnimationPlayer[]) {
  }
}

export class AnimationFactory implements AnimationASTVisitor {
  constructor(private _ast: AnimationAST) {}

  visitAnimationStep(ast: AnimationStepAST, context?: AnimationFactoryContext): void {
    var player = context.renderer['animate'](context.element, ast.keyframes, ast.duration, ast.delay, ast.easing);
    context.players.push(player);
  }

  visitAnimationSequence(ast: AnimationSequenceAST, context?: AnimationFactoryContext): void {
    var playerFns = ast.steps.map((step) => {
      return () => {
        var players = [];
        var ctx = new AnimationFactoryContext(context.element, context.renderer, context.index, players);
        step.visit(this, ctx);
        return players[0];
      }
    });
    context.players.push(new AnimationSequencePlayer(playerFns));
  }

  visitAnimationGroup(ast: AnimationGroupAST, context?: AnimationFactoryContext): void {
    var ctx = new AnimationFactoryContext(context.element, context.renderer, context.index, []);
    ast.steps.forEach((step) => {
      step.visit(this, ctx);
    });
    context.players.push(new AnimationGroupPlayer(ctx.players));
  }

  start(element: Node, renderer: Renderer, index: number): AnimationPlayer {
    var players = [];
    var context = new AnimationFactoryContext(element, renderer, index, players);
    this._ast.visit(this, context);
    return players[0];
  }
}

export class AnimationAST {
  visit(visitor: AnimationASTVisitor, context?: any): void {}
}

export class AnimationStepAST extends AnimationAST {
  constructor(public keyframes: AnimationKeyframe[], public duration: number, public delay: number, public easing: string) {
    super();
  }

  visit(visitor: AnimationASTVisitor, context?: any): void {
    visitor.visitAnimationStep(this, context);
  }
}

export class AnimationStepsAST extends AnimationAST {
  constructor(public steps: AnimationAST[]) {
    super();
  }
}

export class AnimationSequenceAST extends AnimationStepsAST {
  constructor(steps: AnimationAST[]) { super(steps); }
  visit(visitor: AnimationASTVisitor, context?: any): void {
    visitor.visitAnimationSequence(this, context);
  }
}

export class AnimationGroupAST extends AnimationStepsAST {
  constructor(steps: AnimationAST[]) { super(steps); }
  visit(visitor: AnimationASTVisitor, context?: any): void {
    visitor.visitAnimationGroup(this, context);
  }
}
