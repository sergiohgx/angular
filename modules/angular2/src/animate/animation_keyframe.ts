import {StringMapWrapper} from 'angular2/src/facade/collection';
import {isStringMap} from 'angular2/src/facade/lang';

export class KeyframeStyles {
  constructor(public styles: {[key: string]: string}) {}

  addStyles(styles: {[key: string]: string}, override: boolean = false): void {
    this.styles = override
        ? StringMapWrapper.merge(styles, this.styles)
        : StringMapWrapper.merge(this.styles, styles);
  }
}

export class AnimationKeyframe {
  static fromStyles(position, styles: {[key: string]: string}): AnimationKeyframe {
    return new AnimationKeyframe(position, [new KeyframeStyles(styles)]);
  }

  constructor(public position: string, public styles: KeyframeStyles[]) {
  }

  addStyles(styles: {[key: string]: string}): void {
    for (var i = this.styles.length; i >= 0; i--) {
      let entry = this.styles[i];
      if (isStringMap(entry.styles)) {
        entry.addStyles(styles);
        break;
      }
    }
  }
}
