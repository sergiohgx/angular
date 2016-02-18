import {Injectable} from 'angular2/core';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {CssMatchMedia} from 'angular2/src/animate/ui/css_match_media';
import {CssDefinition, CssKeyframeDefinition} from 'angular2/src/animate/ui/css_definition';
import {isPresent} from 'angular2/src/facade/lang';

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

  resolveClassDefinition(definitions: CssDefinition[]): CssDefinition {
    var styles = definitions.length > 0
        ? this.resolveStyles(definitions)
        : {};
    return new CssDefinition('all', styles);
  }

  resolveKeyframeDefinition(definitions: CssKeyframeDefinition[]): CssKeyframeDefinition {
    var chosenDef;
    definitions.forEach((def) => {
      var allow = def.mediaQuery == 'all' || this._matchMedia.match(def.mediaQuery);
      if (allow) {
        chosenDef = def;
      }
    });
    return chosenDef;
  }
}
