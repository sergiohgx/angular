import {DomAnimatePlayer} from 'angular2/src/platform/dom/animation/dom_animate_player';
import {isPresent} from "angular2/src/facade/lang";

export class MockDomAnimatePlayer implements DomAnimatePlayer {
  public captures: {[key: string]: any[]} = {};
  private _position: number = 0;

  _capture(method: string, data: any) {
    if (!isPresent(this.captures[method])) {
      this.captures[method] = [];
    }
    this.captures[method].push(data);
  }

  cancel() { this._capture('cancel', null); }
  play() { this._capture('play', null); }
  pause() { this._capture('pause', null); }
  reverse() { this._capture('reverse', null); }
  stop() { this._capture('stop', null); }
  set onfinish(fn) { this._capture('onfinish', fn); }
  get onfinish() { return null; }
  set position(val) { this._capture('position', val); this._position = val; }
  get position() { return this._position; }
}

