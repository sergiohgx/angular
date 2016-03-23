import {PromiseWrapper} from 'angular2/src/facade/async';

export abstract class AnimationPlayer {
  abstract subscribe(fn: Function): void;
  abstract then(fn: Function): Promise<any>;
  abstract play(): void;
  abstract pause(): void;
  abstract reverse(): void;
  abstract end(): void;
}

export class NoOpAnimationPlayer implements AnimationPlayer {
  private _queue = [];

  constructor() {
    this.tick();
  }
  tick() {
    window['setTimeout'](() => this._flush());
  }
  subscribe(fn: Function): void {
    this._queue.push(fn);
  }
  _flush(): void {
    this._queue.forEach((entry) => {
      entry();
    });
    this._queue = [];
  }
  then(fn: Function): Promise<any> {
    var defer = PromiseWrapper.completer();
    var resolve: Function = defer['resolve'];
    this.subscribe(() => resolve());
    return <Promise<any>>defer['promise'];
  }
  play(): void { }
  pause(): void { }
  reverse(): void { }
  end(): void { }
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
}
