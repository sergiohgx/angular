import {NumberWrapper} from 'angular2/src/facade/lang';

import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';

function normalizePercentage(p): number {
  var value = null;
  if (p instanceof String) {
    var numStr = p;
    if (p[p.length - 1] == "%") {
      numStr = p.substring(0, p.length - 1);
    }
    value = NumberWrapper.parseInt(numStr, 10) / 100;
  }
  return value;
}

export class WebAnimationsPlayer implements AnimationPlayer {
  private _subscriptions: Function[] = [];

  constructor(private _player: any, private _options: any) {
    this._player.onfinish = () => this._onFinish();
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

  private _onFinish() {
    this._subscriptions.forEach((fn) => {
      fn();
    });
  }

  subscribe(fn): void {
    this._subscriptions.push(fn);
  }

  play(): void {
    this._player.play();
  }

  pause(): void {
    this._player.pause();
  }

  end(): void {
    this._player.stop();
  }

  reverse(): void {
    this._player.reverse();
  }

  setPosition(pos: number): void {
    this._player.currentTime = pos;
  }

  getPosition(): number {
    return this._player.currentTime;
  }
}

export class WebAnimationsDriver implements AnimationDriver {
  static isSupported(): boolean {
    return DOM.supportsWebAnimation();
  }

  constructor() {
    if (!WebAnimationsDriver.isSupported()) {
      throw new Error('Browser does not support web animations');
    }
  }

  style(element: HTMLElement, styles: {[key: string]: string}) {
    for (var style in styles) {
      DOM.setStyle(element, style, styles[style]);
    }
  }

  private _animate(element, styles: any[], options: any = {}): AnimationPlayer {
    options['fillMode'] = 'forward';
    var player = element.animate(styles, options);
    return new WebAnimationsPlayer(player, options);
  }

  animateSteps(element: HTMLElement,
               steps: {[key: string]: {[key: string]: string}},
               duration: number,
               delay: number): AnimationPlayer {

    var formattedSteps = [];
    for (var time in steps) {
      var data = Object.assign(steps[time]);
      data['offset'] = normalizePercentage(time);
      formattedSteps.push(data);
    }

    return this._animate(element, formattedSteps, {
      duration: duration,
      delay: delay
    });
  }

  animateFromTo(element: HTMLElement,
                startStyles: {[key: string]: string},
                endStyles: {[key: string]: string},
                duration: number,
                delay: number): AnimationPlayer {

    var formattedSteps = [startStyles, endStyles];
    return this._animate(element, formattedSteps, {
      duration: duration,
      delay: delay
    });
  }
}
