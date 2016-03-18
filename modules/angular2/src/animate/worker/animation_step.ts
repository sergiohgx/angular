import {Set, Map, ListWrapper, StringMapWrapper} from 'angular2/src/facade/collection';
import {NumberWrapper} from 'angular2/src/facade/lang';
import {Renderer} from 'angular2/src/core/render/api';

import {parseTime} from 'angular2/src/animate/shared';
import {AnimationDefinition} from 'angular2/src/animate/worker/animation_definition';
import {AnimationElement} from 'angular2/src/animate/animation_element';
import {AnimationPlayer} from 'angular2/src/animate/animation_player';
import {AnimationStyles} from 'angular2/src/animate/worker/animation_styles';
import {AnimationGroupPlayer} from 'angular2/src/animate/worker/animation_group';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';

export enum AnimationTokenType {
  CSS_CLASS,
  CSS_KEYFRAME,
  INLINE_STYLES,
  SNAPSHOT
}

export class AnimationToken {
  constructor(public type: AnimationTokenType, public value: any) {}
}

export class AnimationStep extends AnimationDefinition {
  private _transforms: any[] = [];
  private _staggerTime: number = 0;
  private _cssTokens = new Set<AnimationToken>();

  constructor(private _tokens: AnimationToken[],
              private _duration: number = 0,
              private _delay: number = 0,
              private _easing: string = 'linear') {
    super();
    this._tokens.forEach((token) => {
      this._cssTokens.add(token);
    });
  }

  private _createKeyframes(lookup: AnimationStyles): AnimationKeyframe[] {
    var INITIAL_KEYFRAME = '0%';
    var TERMINAL_KEYFRAME = '100%';

    var keyframes = [];
    this._tokens.forEach((token: AnimationToken) => {

      var values: AnimationKeyframe[];
      switch (token.type) {
        case AnimationTokenType.CSS_KEYFRAME:
        case AnimationTokenType.CSS_CLASS:
          values = lookup.lookupAndResolve(token);
          break;

        default:
          values = [new AnimationKeyframe(TERMINAL_KEYFRAME, token.value)];
          break;
      }

      values.forEach((keyframe: AnimationKeyframe) => {
        var position = keyframe.position;
        var styles = keyframe.styles;

        var compareValue;
        if (position == 'to') {
          position = TERMINAL_KEYFRAME;
          compareValue = 100;
        } else if (position == 'from') {
          position = INITIAL_KEYFRAME;
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

  transform(value: string, args: any): AnimationStep {
    this._transforms.push([value, args]);
    return this;
  }

  stagger(timing: string): AnimationDefinition {
    this._staggerTime = parseTime(timing);
    return this;
  }

  getTokens(): Set<AnimationToken> {
    return this._cssTokens;
  }

  start(element: AnimationElement,
        context: any,
        styleLookup: AnimationStyles,
        renderer: Renderer,
        startIndex: number): AnimationPlayer {

    // only the DOM renderer supports this method
    var delay = this._staggerTime * startIndex + this._delay;
    return renderer['animate'](element, this._createKeyframes(styleLookup), this._duration, delay, this._easing, this._transforms);
  }
}
