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
