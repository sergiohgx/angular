import {Injectable} from 'angular2/core';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {CssMatchMedia} from 'angular2/src/animate/worker/css_match_media';
import {CssDefinition} from 'angular2/src/animate/worker/css_definition';
import {isPresent} from 'angular2/src/facade/lang';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';

@Injectable()
export class CssMediaQueryResolver {
  constructor(private _matchMedia: CssMatchMedia) {}

  resolveStyles(definitions: CssDefinition[]): {[key: string]: any} {
    var styles = {};
    definitions.forEach((def) => {
      var allow = !isPresent(def.mediaQuery) || def.mediaQuery == 'all' || this._matchMedia.match(def.mediaQuery);
      if (allow) {
        styles = StringMapWrapper.merge(styles, def.styles);
      }
    });
    return styles;
  }

  resolveClassDefinition(definitions: CssDefinition[]): {[key: string]: string} {
    var styles = definitions.length > 0
        ? this.resolveStyles(definitions)
        : {};
    return styles;
  }

  resolveKeyframeDefinition(definitions: CssDefinition[]): AnimationKeyframe[] {
    var chosenDef;
    definitions.forEach((def) => {
      var allow = def.mediaQuery == 'all' || this._matchMedia.match(def.mediaQuery);
      if (allow) {
        chosenDef = def;
      }
    });

    var keyframes = [];
    if (isPresent(chosenDef)) {
      StringMapWrapper.forEach(chosenDef, (styles, position) => {
        keyframes.push(new AnimationKeyframe(position, styles));
      });
    }

    return keyframes;
  }
}
