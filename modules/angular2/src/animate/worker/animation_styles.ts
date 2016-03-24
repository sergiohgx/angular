import {CssStylesResolver} from 'angular2/src/animate/worker/css_styles_resolver';
import {CssDefinition} from 'angular2/src/animate/worker/css_definition';
import {BaseException} from 'angular2/src/facade/exceptions';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {isPresent} from 'angular2/src/facade/lang';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';

export class AnimationStyles {
  private definitions: {[name: string]: CssDefinition[]} = {};
  private _resolver = new CssStylesResolver();

  constructor(styles: {[key: string]: any[]}) {
    StringMapWrapper.forEach(styles, (entries: any[], token) => {
      var arr = this.definitions[token];
      if (!isPresent(arr)) {
        arr = this.definitions[token] = [];
      }
      entries.forEach((entry) => {
        arr.push(new CssDefinition(entry[0], entry[1]));
      });
    });
  }

  _lookup(token: string): CssDefinition[] {
    var results = this.definitions[token];
    if (!isPresent(results)) {
      throw new BaseException(`unable to resolve CSS token value "${token}" from the given component styles`);
    }
    return results;
  }

  lookupClass(className: string): AnimationKeyframe {
    return AnimationKeyframe.fromStyles('100%', this._resolver.resolveClassDefinition(this._lookup(className)));
  }

  lookupKeyframe(keyframeName: string): AnimationKeyframe[] {
    return this._resolver.resolveKeyframeDefinition(this._lookup(keyframeName));
  }
}
