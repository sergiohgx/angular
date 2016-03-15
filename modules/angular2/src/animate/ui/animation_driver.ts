import {StringMapWrapper} from 'angular2/src/facade/collection';
import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';

export abstract class AnimationDriver {
  abstract style(element: HTMLElement, styles: {[key: string]: string}): void;

  abstract animateSteps(element: HTMLElement,
               steps: {[key: string]: {[key: string]: string}},
               duration: number,
               delay: number,
               easing: string,
               skipFill: boolean): AnimationPlayer;

  abstract animateFromTo(element: HTMLElement,
                startStyles: {[key: string]: string},
                endStyles: {[key: string]: string},
                duration: number,
                delay: number,
                easing: string,
                skipFill: boolean): AnimationPlayer;
}

export class NoOpAnimationDriver extends AnimationDriver {
  constructor() {
    super();
  }

  style(element: HTMLElement, styles: {[key: string]: string}): void {
    StringMapWrapper.forEach(styles, (value, prop) => {
      DOM.setStyle(element, prop, value.toString());
    });
  }

  static isSupported(): boolean {
    return true;
  }

  animateSteps(element: HTMLElement,
               steps: {[key: string]: {[key: string]: string}},
               duration: number,
               delay: number,
               easing: string,
               skipFill: boolean): AnimationPlayer {
    StringMapWrapper.forEach(steps, (styles, step) => {
      this.style(element, styles);
    });

    return new NoOpAnimationPlayer();
  }

  animateFromTo(element: HTMLElement,
                startStyles: {[key: string]: string},
                endStyles: {[key: string]: string},
                duration: number,
                delay: number,
                easing: string,
                skipFill: boolean): AnimationPlayer {
    this.style(element, startStyles);
    this.style(element, endStyles);
    return new NoOpAnimationPlayer();
  }
}
