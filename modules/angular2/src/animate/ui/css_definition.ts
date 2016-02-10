export class CssDefinition {
  constructor(public mediaQuery: string,
              public styles: {[key: string]: any}) {}

  getStyles() {
    return this.styles;
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
