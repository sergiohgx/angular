import {isPresent} from 'angular2/src/facade/lang';
import {Set, Map, StringMapWrapper, ListWrapper} from 'angular2/src/facade/collection';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';
import {AnimationElement} from 'angular2/src/animate/animation_element';

export abstract class DOMAnimationDriver extends AnimationDriver {
  private _nextAnimationID = 0;
  private _snapshots: {[key: string]: any} = {};

  private _currentStyles = new Map<HTMLElement, {[key: string]: string}>();

  constructor() {
    super();
    if (!this.isSupported()) {
      throw new Error('Browser driver ' + this.getName() + ' is not supported');
    }
  }

  abstract getName(): string;
  abstract isSupported(): boolean;

  createSnapshot(entry: AnimationElement, name: string, styleProperties: string[]): string {
    var values = {};
    var gcs = DOM.getComputedStyle(entry.element);
    styleProperties.forEach((prop) => {
      values[prop] = gcs[prop];
    });

    var index = this._nextAnimationID++;
    var id = index.toString();
    this._snapshots[id] = values;

    return id;
  }

  clearSnapshots(ids: string[]): void {
    ids.forEach((id) => {
      this._snapshots[id] = null;
    });
  }

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

      StringMapWrapper.forEach(kf.styles, (value, prop) => {
        collectedProperties.add(prop);
        flatStyles[prop] = value;
      });
    });

    if (duration == 0) {
      this._currentStyles.set(element, flatStyles);
      return [
        new AnimationKeyframe('0%', flatStyles),
        new AnimationKeyframe('100%', flatStyles)
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
      StringMapWrapper.forEach(startingKeyframe.styles, (val, prop) => {
        startStyles[prop] = val;
        finalStyles[prop] = val;
      });
    }

    StringMapWrapper.forEach(endingKeyframe.styles, (val, prop) => {
      finalStyles[prop] = val;
    });

    this._currentStyles.set(element, finalStyles);

    return [
      new AnimationKeyframe('0%', startStyles),
      new AnimationKeyframe('100%', finalStyles)
    ];
  }

  style(element: HTMLElement, styles: {[key: string]: string}): void {
    StringMapWrapper.forEach(styles, (value, prop) => {
      DOM.setStyle(element, prop, value.toString());
    });
  }
}
