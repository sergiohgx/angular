import {NoOpAnimationPlayer,AnimationPlayer} from 'angular2/src/core/animation/animation_player';

export class AnimationSequencePlayer implements AnimationPlayer {
  private _currentIndex: number = 0;
  private _activePlayer: AnimationPlayer;
  private _subscriptions: Function[] = [];

  constructor(private _players: AnimationPlayer[]) {
    this._onNext(false);
  }

  _onNext(autostart: boolean) {
    if (this._currentIndex >= this._players.length) {
      this._activePlayer = new NoOpAnimationPlayer();
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

  close(): void {
    this._players.forEach(player => player.close());
  }
}
