import {DomAnimatePlayer} from 'angular2/src/platform/dom/animation/dom_animate_player';
import {scheduleMicroTask} from 'angular2/src/facade/lang';

export class Parse5DomAnimatePlayer implements DomAnimatePlayer {
  public onfinish = () => {};
  public position = 0;

  constructor() {
    scheduleMicroTask(() => this.onfinish());
  }

  cancel(): void {}
  play(): void {}
  pause(): void {}
  reverse(): void {}
  stop(): void {}
}
