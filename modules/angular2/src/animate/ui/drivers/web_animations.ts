import {isString, NumberWrapper} from 'angular2/src/facade/lang';
import {PromiseWrapper} from 'angular2/src/facade/async';
import {StringMapWrapper} from 'angular2/src/facade/collection';

import {DOM} from 'angular2/src/platform/dom/dom_adapter';
import {copy} from 'angular2/src/animate/shared';

import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {AnimationPlayer} from 'angular2/src/animate/animation_player';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';
import {AnimationElement} from 'angular2/src/animate/animation_element';

import {DOMAnimationDriver} from 'angular2/src/animate/ui/dom_animation_driver';

function normalizePercentage(p): number {
  var value = null;
  if (isString(p)) {
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

  then(fn: Function): Promise<any> {
    var defer = PromiseWrapper.completer();
    var resolve: Function = defer['resolve'];
    this.subscribe(() => resolve());
    return <Promise<any>>defer['promise'];
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

export class WebAnimationsDriver extends DOMAnimationDriver implements AnimationDriver {
  constructor() {
    super();
  }

  getName(): string {
    return 'web-animations';
  }

  isSupported(): boolean {
    return DOM.supportsWebAnimation();
  }

  animate(element: AnimationElement, keyframes: AnimationKeyframe[], duration: number, delay: number, easing: string, transforms: string[]): AnimationPlayer {
    var node = element.element;
    keyframes = this.prepareKeyframes(node, keyframes, duration);

    var formattedSteps = [];
    keyframes.forEach((keyframe) => {
      var data = {};
      StringMapWrapper.forEach(keyframe.styles, (val, prop) => {
        data[prop] = val;
      });
      data['offset'] = normalizePercentage(keyframe.position);
      formattedSteps.push(data);
    });

    var options = {
      'duration': duration,
      'delay': delay,
      'easing': easing,
      'fill': 'forwards'
    };

    var player = node['animate'](formattedSteps, options);
    return new WebAnimationsPlayer(player, options);
  }
}
