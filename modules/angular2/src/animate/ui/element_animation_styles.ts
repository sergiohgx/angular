import {DOM} from 'angular2/src/platform/dom/dom_adapter';
import {removeOrRestoreCssStyles} from './util';
import {StringMapWrapper} from 'angular2/src/facade/collection';

export class ElementAnimationStyles {

  private _styles: {[key: string]: string} = {};

  constructor(private _element: HTMLElement) {}

  registerStyles(styles: {[key: string]: string}): void {
    StringMapWrapper.keys(styles).forEach((key) => this.registerStyle(key));
  }

  registerStyle(style: string): void {
    if (!StringMapWrapper.contains(this._styles, style)) {
      var value = DOM.getStyle(this._element, style);
      this._styles[style] = value;
    }
  }

  flush() {
    removeOrRestoreCssStyles(this._element, this._styles);
    this._styles = {};
  }
}
