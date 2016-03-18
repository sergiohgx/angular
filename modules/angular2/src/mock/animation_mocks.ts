export class Temp {}
/*
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/animate/ui/animation_player';

export class MockAnimationPlayer extends NoOpAnimationPlayer {
  // TODO
}

export class MockAnimationDriver extends AnimationDriver {
  captures = {};

  _capture(method, element, data) {
    this.captures[method] = this.captures || [];
    this.captures[method].push({
      'element': element,
      'data': data
    });
  }

  style(element: HTMLElement, styles: {[key: string]: string}): void {
    this._capture('style', element, {
      'styles': styles
    });
  }

  animateSteps(element: HTMLElement,
               steps: {[key: string]: {[key: string]: string}},
               duration: number,
               delay: number,
                easing: string,
               skipFill: boolean): AnimationPlayer {
    this._capture('style', element, {
      'steps': steps,
      'duration': duration,
      'delay': delay,
      'easing': easing,
      'skipFill': skipFill
    });

    return new MockAnimationPlayer();
  }

  animateFromTo(element: HTMLElement,
                startStyles: {[key: string]: string},
                endStyles: {[key: string]: string},
                duration: number,
                delay: number,
                easing: string,
                skipFill: boolean): AnimationPlayer {
    return this.animateSteps(element, {
      '0%': startStyles,
      '100%': endStyles
    }, duration, delay, easing, skipFill);
  }
}
*/
