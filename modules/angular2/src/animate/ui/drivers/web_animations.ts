import {isString, NumberWrapper} from 'angular2/src/facade/lang';
import {StringMapWrapper} from 'angular2/src/facade/collection';

import {DOM} from 'angular2/src/platform/dom/dom_adapter';

import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {AnimationPlayer} from 'angular2/src/core/animation/animation_player';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';

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

  constructor(private _player: any) {
    // this is required to make the player startable at a later time
    this._player.cancel();
    this._player.onfinish = () => this._onFinish();
  }

  private _onFinish() {
    this._subscriptions.forEach((fn) => {
      fn();
    });
  }

  onDone(fn): void {
    this._subscriptions.push(fn);
  }

  play(): void {
    this._player.play();
  }

  pause(): void {
    this._player.pause();
  }

  finish(): void {
    this._player.stop();
  }

  reverse(): void {
    this._player.reverse();
  }

  restart(): void {
    this._player.cancel();
    this._player.start();
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

  animate(element: Node, keyframes: AnimationKeyframe[], duration: number, delay: number, easing: string): AnimationPlayer {
    var elm = <HTMLElement>element;
    keyframes = this.prepareKeyframes(elm, keyframes, duration);

    var formattedSteps = [];
    keyframes.forEach((keyframe) => {
      var data = {};
      keyframe.styles.forEach((entry) => {
        StringMapWrapper.forEach(entry.styles, (val, prop) => {
          data[prop] = val;
        });
      });
      data['offset'] = normalizePercentage(keyframe.position);
      formattedSteps.push(data);
    });

    var player = elm['animate'](formattedSteps, {
      'duration': duration,
      'delay': delay,
      'easing': easing,
      'fill': 'forwards'
    });

    return new WebAnimationsPlayer(player);
  }
}
