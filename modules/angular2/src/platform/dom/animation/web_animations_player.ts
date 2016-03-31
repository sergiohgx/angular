import {AnimationPlayer} from 'angular2/src/core/animation/animation_player';
import {DomAnimatePlayer} from 'angular2/src/platform/dom/animation/dom_animate_player';

export class WebAnimationsPlayer implements AnimationPlayer {
  private _subscriptions: Function[] = [];

  constructor(private _player: DomAnimatePlayer) {
    // this is required to make the player startable at a later time
    this._player.cancel();
    this._player.onfinish = () => this._onFinish();
  }

  private _onFinish() {
    this._subscriptions.forEach(fn => fn());
  }

  onDone(fn): void {
    this._subscriptions.push(fn);
  }

  play(): void {
    this._player.play();
  }

  pause(): void {
    this._player.pause();
  }

  finish(): void {
    this._player.stop();
  }

  reverse(): void {
    this._player.reverse();
  }

  restart(): void {
    this._player.cancel();
    this.play();
  }

  close(): void {
    this._player.cancel();
  }
}
