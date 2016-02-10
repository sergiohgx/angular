import {Injectable} from 'angular2/core';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';

@Injectable()
export class CssMatchMedia {
  match(mediaQuery: string): boolean {
    return DOM.matchMedia(mediaQuery);
  }
}
