import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/core/animation/animation_player';

export class MockAnimationPlayer extends NoOpAnimationPlayer {
  log = [];

  play(): void {
    this.log.push('play');
    super.play();
  }

  pause(): void {
    this.log.push('pause');
    super.pause();
  }

  reverse(): void {
    this.log.push('reverse');
    super.reverse();
  }

  restart(): void {
    this.log.push('restart');
    super.restart();
  }

  finish(): void {
    this.log.push('finish');
    this.flush();
  }

  tick() { }

  close(): void {
    this.log.push('close');
    super.close();
  }
}
