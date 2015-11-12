import {Promise, PromiseWrapper} from 'angular2/src/facade/async';
import {Animation} from 'angular2/src/animate/ui/animation';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {AnimationElement} from 'angular2/src/animate/ui/animation_element';
import {AnimationHelperMap} from 'angular2/src/animate/ui/animation_helper_map';
import {CssSelectorStylesMap} from 'angular2/src/animate/ui/css_selector_styles_map';

export class SequencedAnimation implements Animation {

  constructor(private _steps: Animation[]) {}

  start(elements: AnimationElement[],
        styleLookup: CssSelectorStylesMap,
        helpers: AnimationHelperMap,
        driver: AnimationDriver): AnimationPlayer {

    if (this._steps.length == 0) return new NoOpAnimationPlayer();

    var playerFns: Function[] = this._steps.map(step => {
      return () => step.start(elements, styleLookup, helpers, driver);
    });

    return new SequencedAnimationPlayer(playerFns);
  }
}

export class SequencedAnimationPlayer implements AnimationPlayer {
  private _currentIndex: number = 0;
  private _activePlayers: AnimationPlayer[] = [];
  private _subscriptions: Function[] = [];

  constructor(private _playerFns: Function[]) {
    this._onNext();
  }

  _onNext() {
    if (this._currentIndex >= this._playerFns.length) {
      this._onFinish();
    } else {
      var next = this._playerFns[this._currentIndex++];
      var player = next();
      this._activePlayers.push(player);
      player.subscribe(() => this._onNext());
    }
  }

  _onFinish() {
    this._subscriptions.forEach(subscription => subscription());
    this._subscriptions = [];
  }

  subscribe(fn: Function): void {
    this._subscriptions.push(fn);
  }

  play():void {
    this._activePlayers.forEach(player => player.play());
  }

  pause(): void {
    this._activePlayers.forEach(player => player.pause());
  }

  reverse(): void {
    this._activePlayers.forEach(player => player.reverse());
  }

  end(): void {
    this._activePlayers.forEach(player => player.end());
  }

  getDuration(): number {
    return this._activePlayers.reduce((duration, player) => {
      return Math.max(duration, player.getDuration());
    }, 0);
  }

  getDelay(): number {
    return this._activePlayers.reduce((delay, player) => {
      return Math.max(delay, player.getDelay());
    }, 0);
  }

  getPosition(): number {
    return this._activePlayers.length ? this._activePlayers[0].getPosition() : 0;
  }

  setPosition(pos: number): void {
    this._activePlayers.forEach(player => player.setPosition(pos));
  }
}
