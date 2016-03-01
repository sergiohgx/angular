import {CssMediaQueryResolver} from 'angular2/src/animate/ui/css_media_query_resolver';
import {CssDefinition} from 'angular2/src/animate/ui/css_definition';
import {MapWrapper, StringMapWrapper} from 'angular2/src/facade/collection';
import {isPresent, isString, isStringMap} from 'angular2/src/facade/lang';
import {copy} from 'angular2/src/animate/ui/util';

export class AnimationStyles {
  private definitions: {[name: string]: CssDefinition[]} = {};
  private _cache: {[name: string]: any} = {};

  constructor(private _resolver: CssMediaQueryResolver, styles: {[key: string]: any}) {
    StringMapWrapper.forEach(styles, (entries, className) => {
      var arr = this.definitions[className] = this.definitions[className] || [];
      entries.forEach((entry) => {
        arr.push(new CssDefinition(entry[0], entry[1]));
      });
    });
  }

  lookupAndResolve(entries: string[]): CssDefinition {
    var cacheKey = '';
    var classes = [];

    entries.forEach((cssToken) => {
      if (isString(cssToken)) {
        cacheKey += cssToken + ' ';
      }
      classes.push(cssToken);
    });

    // TODO (matsko): reintroduce caching
    var styles: {[key: string]: any} = null; //this._cache[cacheKey];
    if (!isPresent(styles)) {
      styles = this._cache[cacheKey] = this._lookup(classes).getStyles();
    }

    // we copy the styles so that the cache doesn't get mutated
    return new CssDefinition('all', copy(styles));
  }

  _lookup(classes: any[]): CssDefinition {
    var definitions = [];
    classes.forEach((className) => {
      if (isString(className)) {
        var defs = this.definitions[className];
        if (isPresent(defs)) {
          defs.forEach((def) => {
            definitions.push(def);
          });
        }
      } else if (isStringMap(className)) {
        var def = new CssDefinition('all', <{[key: string]: any}>className);
        definitions.push(def);
      }
    });
    return this._resolver.resolveClassDefinition(definitions);
  }
}
