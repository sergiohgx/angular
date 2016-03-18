import {isPresent} from 'angular2/src/facade/lang';
import {PromiseWrapper} from 'angular2/src/facade/async';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {removeEventListener} from 'angular2/src/animate/shared';

import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {AnimationPlayer} from 'angular2/src/animate/animation_player';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';
import {AnimationElement} from 'angular2/src/animate/animation_element';

import {DOMAnimationDriver} from 'angular2/src/animate/ui/dom_animation_driver';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';

function generateKeyframes(name, keyframes: AnimationKeyframe[]) {
  var css = name + ' {' + "\n";
  keyframes.forEach((keyframe) => {
    css += keyframe.position + " {\n";
    StringMapWrapper.forEach(keyframe.styles, (value, prop) => {
      css += prop + ":" + value + ";\n";
    });
    css += " }\n";
  });
  css += "}\n";

  return "@keyframes " + css + "@-webkit-keyframes " + css;
}

function normalizeCssTime(duration): string {
  if (duration instanceof String) {
    if (duration.length > 1) {
      var suffix = duration.substring(duration.length - 2, duration.length);

      // no need to add anything since a timing suffix already exists
      if (suffix == 'ms' || suffix[1] == 's') {
        return duration;
      }
    }
  }
  return duration + 'ms';
}

function buildAnimationStyle(keyframeName, duration, delay, easing) {
  var style = keyframeName + ' ' + normalizeCssTime(duration);
  if (isPresent(delay)) {
    style += ' ' + normalizeCssTime(delay);
  }
  if (isPresent(easing)) {
    style += ' ' + normalizeCssTime(easing);
  }
  return style;
}

export class CssAnimationsPlayer extends AnimationPlayer {
  private _subscriptions: Function[] = [];
  private _boundOnFinishEvent: Function;
  private _isReversed: boolean = false;

  constructor(private _element: HTMLElement, private _keyframeSequence: string, private _options: any = {}) {
    super();
    // we assign this to a member variable so we can
    // remove the callback event later on
    this._boundOnFinishEvent = () => this.end();

    var animationStyle = buildAnimationStyle(_keyframeSequence, _options['duration'], _options['delay'], _options['easing']);

    DOM.setStyle(_element, 'animation', animationStyle);
    DOM.setStyle(_element, '-webkit-animation', animationStyle);

    DOM.setStyle(_element, 'animation-fill-mode', 'forwards');
    DOM.setStyle(_element, '-webkit-animation-fill-mode', 'forwards');

    DOM.on(this._element, 'animationend', this._boundOnFinishEvent);
    DOM.on(this._element, 'webkitAnimationEnd', this._boundOnFinishEvent);
  }

  private _onFinish() {
    this._subscriptions.forEach((fn) => fn());
    this._subscriptions = [];
  }

  private _cleanUp() {
    removeEventListener(this._element, 'animationend', this._boundOnFinishEvent);
    removeEventListener(this._element, 'webkitAnimationEnd', this._boundOnFinishEvent);
  }

  subscribe(fn: Function) {
    this._subscriptions.push(fn);
  }

  then(fn: Function): Promise<any> {
    var defer = PromiseWrapper.completer();
    var resolve: Function = defer['resolve'];
    this.subscribe(() => resolve());
    return <Promise<any>>defer['promise'];
  }

  getDuration() {
    return this.options['duration'];
  }

  getDelay() {
    return this.options['delay'];
  }

  get options() {
    return this._options;
  }

  play(): void {
    DOM.setStyle(this._element, 'animation-play-state', 'running');
    DOM.setStyle(this._element, '-webkit-animation-play-state', 'running');
  }

  pause(): void {
    DOM.setStyle(this._element, 'animation-play-state', 'paused');
    DOM.setStyle(this._element, '-webkit-animation-play-state', 'paused');
  }

  reverse(): void {
    var value = this._isReversed ? 'normal' : 'reverse';
    DOM.setStyle(this._element, 'animation-direction', value);
    DOM.setStyle(this._element, '-webkit-animation-direction', value);
    this._isReversed = !this._isReversed;
  }

  // NOT IMPLEMENTED for CSS
  setPosition(pos: number): void {}

  // NOT IMPLEMENTED for CSS
  getPosition(): number { return 0; }

  end() {
    this._cleanUp();
    this._onFinish();
  }
}

export class CssAnimationsDriver extends DOMAnimationDriver implements AnimationDriver {
  private _keyframeID: number = 0;

  constructor() {
    super();
  }

  isSupported(): boolean {
    return DOM.supportsCssAnimation();
  }

  getName(): string{
    return 'css-animations';
  }

  animate(element: AnimationElement, keyframes: AnimationKeyframe[], duration: number, delay: number, easing: string, transforms: string[]): AnimationPlayer {
    var name = 'ngSequence' + this._keyframeID++;
    var keyframeCode = generateKeyframes(name, keyframes);
    var styleNode = DOM.createStyleElement(keyframeCode);
    var head = DOM.query('head');
    DOM.appendChild(head, styleNode);

    var options = {
      'duration': duration,
      'delay': delay,
      'easing': easing
    };

    var node = <HTMLElement>element.element;
    var player = new CssAnimationsPlayer(node, name, options);
    player.subscribe(() => {
      keyframes.forEach((keyframe) => {
        StringMapWrapper.forEach(keyframe.styles, (styles, prop) => {
          this.style(node, styles);
        });
      });
    });

    return player;
  }
}
