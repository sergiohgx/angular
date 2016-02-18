import {StringMapWrapper} from 'angular2/src/facade/collection';
import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';

export interface AnimationDriver {
  style(element: HTMLElement, styles: {[key: string]: string}): void;

  animateSteps(element: HTMLElement,
               steps: {[key: string]: {[key: string]: string}},
               duration: number,
               delay: number,
               skipFill: boolean): AnimationPlayer;

  animateFromTo(element: HTMLElement,
                startStyles: {[key: string]: string},
                endStyles: {[key: string]: string},
                duration: number,
                delay: number,
                easing: string,
                skipFill: boolean): AnimationPlayer;
}

export class NoOpAnimationDriver implements AnimationDriver {
  static isSupported(): boolean {
    return true;
  }

  style(element: HTMLElement, styles: {[key: string]: string}) {
    StringMapWrapper.forEach(styles, (value, prop) => {
      DOM.setStyle(element, prop, value.toString());
    });
  }

  animateSteps(element: HTMLElement,
               steps: {[key: string]: {[key: string]: string}},
               duration: number,
               delay: number): AnimationPlayer {
    StringMapWrapper.forEach(steps, (styles, step) => {
      this.style(element, styles)
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
