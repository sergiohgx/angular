import {scheduleMicroTask} from 'angular2/src/facade/lang';

export abstract class AnimationPlayer {
  abstract onDone(fn: Function): void;
  abstract play(): void;
  abstract pause(): void;
  abstract reverse(): void;
  abstract restart(): void;
  abstract finish(): void;
}

export class NoOpAnimationPlayer implements AnimationPlayer {
  private _queue = [];

  constructor() {
    this.tick();
  }
  tick() {
    scheduleMicroTask(() => this.flush());
  }
  onDone(fn: Function): void {
    this._queue.push(fn);
  }
  flush(): void {
    this._queue.forEach((entry) => {
      entry();
    });
    this._queue = [];
  }
  play(): void { }
  pause(): void { }
  reverse(): void { }
  restart(): void { }
  finish(): void { }
}

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

export class AnimationSequencePlayer implements AnimationPlayer {
  private _currentIndex: number = 0;
  private _activePlayer: AnimationPlayer;
  private _subscriptions: Function[] = [];

  constructor(private _players: AnimationPlayer[]) {
    this._onNext(false);
  }

  _onNext(autostart: boolean) {
    if (this._currentIndex >= this._players.length) {
      this._onFinish();
    } else {
      var player = this._players[this._currentIndex++];
      player.onDone(() => this._onNext(true));

      this._activePlayer = player;
      if (autostart) {
        player.play();
      }
    }
  }

  _onFinish() {
    this._subscriptions.forEach(subscription => subscription());
    this._subscriptions = [];
  }

  onDone(fn: Function): void {
    this._subscriptions.push(fn);
  }

  play(): void {
    this._activePlayer.play();
  }

  pause(): void {
    this._activePlayer.pause();
  }

  reverse(): void {
    this._activePlayer.reverse();
  }

  restart(): void {
    this._players.forEach(player => player.restart());
  }

  finish(): void {
    this._players.forEach(player => player.finish());
  }
}
