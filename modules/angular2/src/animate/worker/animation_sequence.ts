import {PromiseWrapper} from 'angular2/src/facade/async';
import {Renderer} from 'angular2/src/core/render/api';
import {Set} from 'angular2/src/facade/collection';

import {AnimationDefinition} from 'angular2/src/animate/worker/animation_definition';
import {AnimationElement} from 'angular2/src/animate/animation_element';
import {AnimationStyles} from 'angular2/src/animate/worker/animation_styles';
import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/animate/animation_player';
import {AnimationToken} from 'angular2/src/animate/worker/animation_step';
import {appendSet} from 'angular2/src/animate/shared';

export class AnimationSequence extends AnimationDefinition {
  private _cssTokens = new Set<AnimationToken>();

  constructor(private _steps: AnimationDefinition[]) {
    super();
    _steps.forEach((step) => {
      appendSet(this._cssTokens, step.getTokens());
    });
  }

  start(element: AnimationElement,
        context: any,
        styleLookup: AnimationStyles,
        renderer: Renderer,
        startIndex: number): AnimationPlayer {
    if (this._steps.length == 0) return new NoOpAnimationPlayer();

    var i = startIndex;
    var playerFns: Function[] = this._steps.map(step => {
      var index = i++;
      return () => step.start(element, context, styleLookup, renderer, index);
    });

    return new AnimationSequencePlayer(playerFns);
  }

  stagger(timing: string): AnimationDefinition {
    return this;
  }

  getTokens(): Set<AnimationToken> {
    return this._cssTokens;
  }
}

export class AnimationSequencePlayer implements AnimationPlayer {
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

  then(fn: Function): Promise<any> {
    var defer = PromiseWrapper.completer();
    var resolve: Function = defer['resolve'];
    this.subscribe(() => {
      resolve();
    });
    return <Promise<any>>defer['promise'];
  }

  play(): void {
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
