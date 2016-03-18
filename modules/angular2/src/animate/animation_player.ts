import {PromiseWrapper} from 'angular2/src/facade/async';

export abstract class AnimationPlayer {
  abstract subscribe(fn: Function): void;
  abstract then(fn: Function): Promise<any>;
  abstract play(): void;
  abstract pause(): void;
  abstract reverse(): void;
  abstract end(): void;
  abstract getDuration(): number;
  abstract getDelay(): number;
  abstract getPosition(): number;
  abstract setPosition(pos: number): void;
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
  getDuration(): number { return 0; }
  getDelay(): number { return 0; }
  getPosition(): number { return 0; }
  setPosition(pos: number): void { }
}
