import {PromiseWrapper} from 'angular2/src/facade/async';
import {Renderer} from 'angular2/src/core/render/api';
import {Set} from 'angular2/src/facade/collection';

import {AnimationElement} from 'angular2/src/animate/animation_element';
import {AnimationStyles} from 'angular2/src/animate/worker/animation_styles';
import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/animate/animation_player';
import {AnimationDefinition} from 'angular2/src/animate/worker/animation_definition';
import {AnimationToken} from 'angular2/src/animate/worker/animation_step';
import {appendSet} from 'angular2/src/animate/shared';

export class AnimationGroup extends AnimationDefinition {
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

    var players = this._steps.map((step) => {
      return step.start(element, context, styleLookup, renderer, startIndex);
    });

    return new AnimationGroupPlayer(players);
  }

  stagger(timing: string): AnimationDefinition {
    return this;
  }

  getTokens(): Set<AnimationToken> {
    return this._cssTokens;
  }
}

export class AnimationGroupPlayer implements AnimationPlayer {
  private _subscriptions: Function[] = [];

  constructor(private _players: AnimationPlayer[]) {
    var count = 0;
    var total = this._players.length;
    var progress = () => {
      if (++count >= total) {
        this._onFinish();
      }
    };
    this._players.forEach(player => player.subscribe(progress));
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
    this.subscribe(() => resolve());
    return <Promise<any>>defer['promise'];
  }

  play() {
    this._players.forEach(player => player.play());
  }

  pause(): void {
    this._players.forEach(player => player.pause());
  }

  reverse(): void {
    this._players.forEach(player => player.reverse());
  }

  end(): void {
    this._players.forEach(player => player.end());
  }

  getDuration(): number {
    return this._players.reduce((duration, player) => {
      return Math.max(duration, player.getDuration());
    }, 0);
  }

  getDelay(): number {
    return this._players.reduce((delay, player) => {
      return Math.max(delay, player.getDelay());
    }, 0);
  }

  getPosition(): number {
    return this._players.length ? this._players[0].getPosition() : 0;
  }

  setPosition(pos: number): void {
    this._players.forEach(player => player.setPosition(pos));
  }
}
