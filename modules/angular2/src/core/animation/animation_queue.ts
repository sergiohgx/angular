import {isPresent} from 'angular2/src/facade/lang';
import {Map} from 'angular2/src/facade/collection';
import {ObservableWrapper} from 'angular2/src/facade/async';
import {NgZone} from 'angular2/src/core/zone/ng_zone';
import {AnimationPlayer} from 'angular2/src/core/animation/animation_player';

class _AnimationQueueEntry {
  constructor(public index: number, public priority: number) {}
}

export class AnimationQueue {
  queue: AnimationPlayer[] = [];
  animationsPerElement = new Map<any, _AnimationQueueEntry>();

  constructor(private _zone: NgZone) {
    ObservableWrapper.subscribe(this._zone.onMicrotaskEmpty, (e) => {
      this.flush();
    });
  }

  public schedule(element: any, priority: number, player: AnimationPlayer, doneFn: Function): void {
    var index = this.queue.length;
    var queueEntry = new _AnimationQueueEntry(index, priority);
    var existingAnimation = this.animationsPerElement.get(element);

    if (isPresent(existingAnimation)) {
      if (existingAnimation.priority > priority) {
        doneFn();
        return;
      }

      index = existingAnimation.index;
    }

    player.onDone(() => doneFn());
    this.queue[index] = player;
    this.animationsPerElement.set(element, queueEntry);
  }

  public flush(): void {
    this.queue.forEach((player: AnimationPlayer) => {
      player.onDone(() => {
        //player.close();
      });
      player.play();
    });

    this.queue = [];
    this.animationsPerElement.clear();
  }
}
