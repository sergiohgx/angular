import {PromiseWrapper} from 'angular2/src/facade/async';
import {Animation} from 'angular2/src/animate/ui/animation';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {AnimationElement} from 'angular2/src/animate/ui/animation_element';
import {AnimationHelperMap} from 'angular2/src/animate/ui/animation_helper_map';
import {AnimationStyles} from 'angular2/src/animate/ui/animation_styles';

export class GroupAnimation extends Animation {
  constructor(private _steps: Animation[]) {
    super();
  }

  start(elements: AnimationElement[],
        styleLookup: AnimationStyles,
        initialStyles: {[key: string]: any},
        driver: AnimationDriver,
        startIndex: number): AnimationPlayer {

    if (this._steps.length == 0) return new NoOpAnimationPlayer();

    var players = this._steps.map((step) => {
      return step.start(elements, styleLookup, initialStyles, driver, startIndex);
    });

    return new GroupAnimationPlayer(players);
  }
}

export class GroupAnimationPlayer implements AnimationPlayer {
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
