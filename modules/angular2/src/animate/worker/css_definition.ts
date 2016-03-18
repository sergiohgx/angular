import {StringMapWrapper} from 'angular2/src/facade/collection';

export class CssDefinition {
  constructor(public mediaQuery: string,
              public styles: {[key: string]: any}) {}

  getStyles() {
    return this.styles;
  }

  getProperties() {
    return StringMapWrapper.keys(this.styles);
  }
}
