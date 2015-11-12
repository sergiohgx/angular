import {RafMutex} from 'angular2/src/animate/ui/raf_mutex';

export interface AnimationPlayer {
  subscribe(fn: Function): void;
  play(): void;
  pause(): void;
  reverse(): void;
  end(): void;
  getDuration(): number;
  getDelay(): number;
  getPosition(): number;
  setPosition(pos: number): void;
}

export class NoOpAnimationPlayer implements AnimationPlayer {
  private _mutex: RafMutex;

  constructor() {
    this._mutex = new RafMutex();

    //there is no animation
    this._mutex.done();
  }
  subscribe(fn: Function): void {
    this._mutex.queue(fn);
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
