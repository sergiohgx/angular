import {mergeAnimationOptions} from "./util";

export interface AnimationPromise {
  then(c1, c2): Promise<any>;
  finally(callback): Promise<any>;
  catch(callback): Promise<any>;
}

export interface AnimationRunner extends AnimationPromise {
  pause(): void;
  resume(): void;
  close(): void;
  isPaused(): boolean;
  isClosed(): boolean;
}

export class RAFRunner implements AnimationPromise {
  private _promise;
  private _resolvePromise;
  private _runnerResolved;
  private _resolved;
  private _rafResolved;
  private _destroyEvents = [];

  static chain(operations) {
    var head;
    operations.forEach((operation) => {
      if (head) {
        head = head.then(operation);
      } else {
        head = operation();
      }
    });
    return head || RAFRunner.when(true);
  }

  static when(value) {
    var promise = new RAFRunner();
    promise.resolve(value);
    return promise;
  }

  static wrap(value) {
    if (value instanceof RAFRunner) {
      return value;
    }

    if (value instanceof Promise) {
      return value.then(() => RAFRunner.when(true));
    }

    return RAFRunner.when(value);
  }

  static all(runners) {
    var count = 0;
    var runnerWrapper = new RAFRunner();

    runners.forEach((runner) => {
      runner.then(progress);
    });

    return runnerWrapper;

    function progress() {
      if (++count == runners.length) {
        runnerWrapper.resolve();
      }
    }
  }

  public constructor() {
    this._promise = new Promise((resolve) => this._resolvePromise = resolve);
    window.requestAnimationFrame(() => this._onRAF());
  }

  public resolve(value = null) {
    this._runnerResolved = true;
    if (this._rafResolved) {
      this._resolve(value);
    }
  }

  private _onRAF() {
    this._rafResolved = true;
    if (this._runnerResolved) {
      this._resolve(true);
    }
  }

  protected _resolve(value = null) {
    this._resolvePromise(value);
    this._resolved = true;
  }

  public onBeforeDestroy(fn) {
    this._destroyEvents.push(fn);
  }

  public destroy() {
    this._destroyEvents.forEach((fn) => fn());
    this._destroyEvents = [];
  }

  get resolved() {
    return this._resolved;
  }

  public then(c1, c2 = () => {}) {
    return this._promise.then(c1, c2);
  }

  public catch(callback) {
    return this._promise.catch(callback);
  }

  public finally(callback) {
    return this._promise.finally(callback);
  }
}

export class CssAnimationRunner extends RAFRunner implements AnimationRunner {
  private _paused;

  protected _resolve(value = null) {
    super._resolve(value);
    document.body.clientWidth + 1;
  }

  public close() {
    this.resolve();
  }

  public isClosed() {
    return this.resolved;
  }

  public pause() {
    this._paused = true;
  }

  public resume() {
    this._paused = false;
  }

  public isPaused() {
    return this._paused;
  }
}
