import {DOM} from 'angular2/src/platform/dom/dom_adapter';

export class RafMutex {
  private _queue: Function[] = [];
  private _frameReady: boolean = false;
  private _taskReady: boolean = false;

  constructor() {
    this.tick(() => {
      this._frameReady = true;
      if (this.ready) {
        this._onReady();
      }
    });
  }

  done() {
    this._taskReady = true;
    if (this.ready) {
      this._onReady();
    }
  }

  private _onReady() {
    this._queue.forEach(fn => fn());
    this._queue = [];
  }

  tick(fn) {
    DOM.requestAnimationFrame(fn);
  }

  get ready(): boolean {
    return this._frameReady && this._taskReady;
  }

  queue(fn) {
    if (this.ready) {
      fn();
    } else {
      this._queue.push(fn);
    }
  }
}
