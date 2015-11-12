var FINAL_KEYFRAME_POSITION = '100%';

export class AnimationStyles {

  //private _styles: {[key: string]: {[key: string]: string}};
  private _styles: any;

  private _isMediaQueryActive;
  private _containsKeyframeAnimation: boolean = false;

  constructor(className: string,
              styleDefinitions: any[],
              isMediaQueryActive: boolean = false) {

    this._isMediaQueryActive = isMediaQueryActive;

    var styles = {};

    styleDefinitions.forEach((style) => {
      if (style['keyframeName']) {
        this._containsKeyframeAnimation = true;
        style['steps'].forEach((style, position) => {
          this._patchNewStylesAtPosition(position, styles, style);
        });
      } else {
        this._patchNewStylesAtPosition(FINAL_KEYFRAME_POSITION, styles, style);
      }
    });

    this._styles = styles;
  }

  _patchNewStylesAtPosition(position: string, lookup, newStyles) {
    var finalStyles = lookup[position];
    if (!finalStyles) {
      finalStyles = {};
      lookup[position] = finalStyles;
    }
    for (var prop in newStyles) {
      finalStyles[prop] = newStyles[prop];
    }
  }

  get styles() {
    return this._styles['100%'];
  }

  get keyframe() {
    return this._styles;
  }
}
