import {StringMapWrapper} from 'angular2/src/facade/collection';

export class AnimationKeyframe {
  constructor(public position: string, public styles: {[key: string]: string}) {
  }

  merge(styles: {[key: string]: string}, reverse: boolean = false): void {
    console.log('merge', styles, this.styles);
    this.styles = reverse
        ? StringMapWrapper.merge(styles, this.styles)
        : StringMapWrapper.merge(this.styles, styles);
  }
}
