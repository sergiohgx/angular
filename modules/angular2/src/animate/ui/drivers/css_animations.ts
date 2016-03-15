import {isPresent} from 'angular2/src/facade/lang';
import {PromiseWrapper} from 'angular2/src/facade/async';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {removeEventListener} from 'angular2/src/animate/ui/util';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';

function generateKeyframes(name, steps: {[key: string]: {[key: string]: string}}) {
  var css = name + ' {' + "\n";
  StringMapWrapper.forEach(steps, (styles, position) => {
    css += position + " {\n";
    StringMapWrapper.forEach(styles, (value, prop) => {
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

export class CssAnimationsPlayer implements AnimationPlayer {
  private _subscriptions: Function[] = [];
  private _boundOnFinishEvent: Function;
  private _isReversed: boolean = false;

  constructor(private _element, private _keyframeSequence, private _options: any = {}) {
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

export class CssAnimationsDriver extends AnimationDriver {
  constructor() {
    super();
    if (!CssAnimationsDriver.isSupported()) {
      throw new Error('Browser does not support CSS animations');
    }
  }

  style(element: HTMLElement, styles: {[key: string]: string}): void {
    StringMapWrapper.forEach(styles, (value, prop) => {
      DOM.setStyle(element, prop, value.toString());
    });
  }

  static isSupported(): boolean {
    // TODO IE9 < doesn't support this
    return true;
  }

  private _keyframeID: number = 0;

  private _animate(element, steps: {[key: string]: any}, duration: number, delay: number, options: any): AnimationPlayer {
    var name = 'ngSequence' + this._keyframeID++;
    var keyframeCode = generateKeyframes(name, steps);
    var styleNode = DOM.createStyleElement(keyframeCode);
    var head = DOM.query('head');
    DOM.appendChild(head, styleNode);

    options['duration'] = duration;
    options['delay'] = delay;
    options['easing'] = null;

    var player = new CssAnimationsPlayer(element, name, options);
    player.subscribe(() => {
      StringMapWrapper.forEach(steps, (styles, prop) => {
        this.style(element, styles);
      });
    });
    return player;
  }

  animateSteps(element: HTMLElement,
               steps: {[key: string]: {[key: string]: string}},
               duration: number,
               delay: number,
               easing: string,
               skipFill: boolean): AnimationPlayer {
    return this._animate(element, steps, duration, delay, {});
  }

  animateFromTo(element: HTMLElement,
                startStyles: {[key: string]: string},
                endStyles: {[key: string]: string},
                duration: number,
                delay: number,
                easing: string,
                skipFill: boolean): AnimationPlayer {
    return this._animate(element, { '0%': startStyles, '100%': endStyles }, duration, delay, {});
  }
}
