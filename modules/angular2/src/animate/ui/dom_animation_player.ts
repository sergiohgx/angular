import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/animate/animation_player';
import {RafMutex} from 'angular2/src/animate/ui/raf_mutex';

export class NoOpDOMAnimationPlayer extends NoOpAnimationPlayer implements AnimationPlayer {
  private _mutex: RafMutex = new RafMutex();
  constructor() {
    super();
    this._mutex.done();
  }
  tick() {
    this._mutex.queue(() => this._flush());
  }
}
