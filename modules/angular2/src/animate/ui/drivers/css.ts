import {isPresent} from 'angular2/src/facade/lang';
import {PromiseWrapper} from 'angular2/src/facade/async';
import {removeEventListener} from 'angular2/src/animate/ui/util';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';

function normalizeCssTime(duration): string {
  if (duration instanceof String) {
    if (duration.length > 1) {
      var suffix = duration.substring(duration.length - 2, duration.length);

      // no need to add anything since a timing suffix already exists
      if (suffix == 'ms' || suffix[1] == 's') {
        return duration;
      }
    }
  }
  return duration + 'ms';
}

export class CssAnimationsPlayer implements AnimationPlayer {
  private _subscriptions: Function[] = [];
  private _boundOnFinishEvent: Function;

  constructor(private _element, private _options: any = {}) {
    // we assign this to a member variable so we can
    // remove the callback event later on
    this._boundOnFinishEvent = () => this.end();
    DOM.on(this._element, 'transitionend', this._boundOnFinishEvent);
  }

  private _onFinish() {
    this._subscriptions.forEach((fn) => fn());
    this._subscriptions = [];
  }

  private _cleanUp() {
    removeEventListener(this._element, 'trasntiionend', this._boundOnFinishEvent);
  }

  subscribe(fn: Function) {
    this._subscriptions.push(fn);
  }

  then(fn: Function): Promise<any> {
    var defer = PromiseWrapper.completer();
    var resolve: Function = defer['resolve'];
    this.subscribe(() => resolve());
    return <Promise<any>>defer['promise'];
  }

  getDuration() {
    return this.options['duration'];
  }

  getDelay() {
    return this.options['delay'];
  }

  get options() {
    return this._options;
  }

  // NOT IMPLEMENTED for CSS
  play(): void {}

  // NOT IMPLEMENTED for CSS
  pause(): void {}

  // NOT IMPLEMENTED for CSS
  reverse(): void {}

  // NOT IMPLEMENTED for CSS
  setPosition(pos: number): void {}

  // NOT IMPLEMENTED for CSS
  getPosition(): number { return 0; }

  end() {
    this._cleanUp();
    this._onFinish();
  }
}

export class CssAnimationsDriver implements AnimationDriver {
  static isSupported(): boolean {
    // TODO IE9 < doesn't support this
    return true;
  }

  style(element: HTMLElement, styles: {[key: string]: string}) {
    for (var style in styles) {
      DOM.setStyle(element, style, styles[style].toString());
    }
  }

  private _animate(element, styles: {[key: string]: string}, duration: number, delay: number, options: any): AnimationPlayer {
    var player, existingStyle, performAnimation = duration > 0;

    if (performAnimation) {
      existingStyle = DOM.getStyle(element, 'transition');
      DOM.setStyle(element, 'transition', normalizeCssTime(duration) + ' linear all');
    }

    this.style(element, styles);

    if (performAnimation) {
      player = new CssAnimationsPlayer(element, options);
      player.subscribe(() => {
        if (isPresent(existingStyle)) {
          DOM.setStyle(element, 'transition', existingStyle);
        } else {
          DOM.removeStyle(element, 'transition');
        }
      });
    } else {
      player = new NoOpAnimationPlayer();
    }

    return player;
  }

  animateSteps(element: HTMLElement,
               steps: {[key: string]: {[key: string]: string}},
               duration: number,
               delay: number,
               skipFill: boolean): AnimationPlayer {
    // TODO implement keyframes
    return null;
  }

  animateFromTo(element: HTMLElement,
                startStyles: {[key: string]: string},
                endStyles: {[key: string]: string},
                duration: number,
                delay: number,
                easing: string,
                skipFill: boolean): AnimationPlayer {

    this.style(element, startStyles);

    var options = {
      'duration': duration,
      'delay': delay,
      'easing': easing,
      'fillMode': skipFill ? 'none' : 'forwards'
    };

    // TODO: make something better
    // this is required to force a flush
    options['width'] = element['clientWidth'];

    return this._animate(element, endStyles, duration, delay, options);
  }
}
