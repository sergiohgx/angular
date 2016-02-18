import {RafMutex} from 'angular2/src/animate/ui/raf_mutex';
import {PromiseWrapper} from 'angular2/src/facade/async';

export interface AnimationPlayer {
  subscribe(fn: Function): void;
  then(fn: Function): Promise<any>;
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
