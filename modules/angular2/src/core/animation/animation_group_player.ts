import {AnimationPlayer} from 'angular2/src/core/animation/animation_player';

export class AnimationGroupPlayer implements AnimationPlayer {
  private _subscriptions: Function[] = [];

  constructor(private _players: AnimationPlayer[]) {
    var count = 0;
    var total = this._players.length;

    this._players.forEach((player) => {
      player.onDone(() => {
        if (++count >= total) {
          this._onFinish();
        }
      });
    });
  }

  _onFinish() {
    this._subscriptions.forEach(subscription => subscription());
    this._subscriptions = [];
  }

  onDone(fn: Function): void {
    this._subscriptions.push(fn);
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

  restart(): void {
    this._players.forEach(player => player.restart());
  }

  finish(): void {
    this._players.forEach(player => player.finish());
  }
}

