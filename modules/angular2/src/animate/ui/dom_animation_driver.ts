import {isPresent} from 'angular2/src/facade/lang';
import {Set, Map, StringMapWrapper, ListWrapper} from 'angular2/src/facade/collection';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';
import {BaseException} from 'angular2/src/facade/exceptions';

export abstract class DOMAnimationDriver extends AnimationDriver {
  private _currentStyles = new Map<HTMLElement, {[key: string]: string}>();

  constructor() {
    super();
    if (!this.isSupported()) {
      throw new BaseException(`Browser driver ${this.getName()} is not supported`);
    }
  }

  abstract getName(): string;
  abstract isSupported(): boolean;

  prepareKeyframes(element: HTMLElement, keyframes: AnimationKeyframe[], duration: number): AnimationKeyframe[] {
    var flatStyles: {[key: string]: string} = {};
    if (duration == 0) {
      flatStyles = this._currentStyles.get(element);
      flatStyles = isPresent(flatStyles) ? flatStyles : {};
    }

    var startingKeyframe, endingKeyframe;
    var collectedProperties = new Set<string>();
    keyframes.forEach((kf) => {
      // TODO (matsko): support offsetted start/end keyframes
      if (kf.position == '0%') {
        startingKeyframe = kf;
      } else if (kf.position == '100%') {
        endingKeyframe = kf;
      }

      kf.styles.forEach((entry) => {
        StringMapWrapper.forEach(entry.styles, (value, prop) => {
          collectedProperties.add(prop);
          flatStyles[prop] = value;
        });
      });
    });

    if (duration == 0) {
      this._currentStyles.set(element, flatStyles);
      return [
        AnimationKeyframe.fromStyles('0%', flatStyles),
        AnimationKeyframe.fromStyles('100%', flatStyles)
      ];
    }

    var existingStyles = this._currentStyles.get(element);
    var startStyles: {[key: string]: string} = {};
    var finalStyles: {[key: string]: string} = {};
    collectedProperties.forEach((prop) => {
      var val = existingStyles[prop];
      if (isPresent(val)) {
        startStyles[prop] = val;
        finalStyles[prop] = val;
      }
    });

    if (isPresent(startingKeyframe)) {
      startingKeyframe.styles.forEach((entry) => {
        StringMapWrapper.forEach(entry.styles, (val, prop) => {
          startStyles[prop] = val;
          finalStyles[prop] = val;
        });
      });
    }

    endingKeyframe.styles.forEach((entry) => {
      StringMapWrapper.forEach(entry.styles, (val, prop) => {
        finalStyles[prop] = val;
      });
    });

    this._currentStyles.set(element, finalStyles);

    return [
      AnimationKeyframe.fromStyles('0%', startStyles),
      AnimationKeyframe.fromStyles('100%', finalStyles)
    ];
  }

  style(element: HTMLElement, styles: {[key: string]: string}): void {
    StringMapWrapper.forEach(styles, (value, prop) => {
      DOM.setStyle(element, prop, value.toString());
    });
  }
}
