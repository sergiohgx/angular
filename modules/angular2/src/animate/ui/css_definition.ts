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

export class CssKeyframeDefinition extends CssDefinition {
  getStyles() {
    return this.styles['100%'];
  }

  getKeyframe() {
    return this.styles;
  }
}
