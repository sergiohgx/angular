import {Injectable} from 'angular2/core';

@Injectable()
export class CssMatchMedia {
  match(mediaQuery: string): boolean {
    // TODO (matsko): support for media queries at some point
    return false;
  }
}
