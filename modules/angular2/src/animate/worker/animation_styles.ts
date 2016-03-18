import {CssMediaQueryResolver} from 'angular2/src/animate/worker/css_media_query_resolver';
import {CssDefinition} from 'angular2/src/animate/worker/css_definition';
import {BaseException} from 'angular2/src/facade/exceptions';
import {MapWrapper, StringMapWrapper} from 'angular2/src/facade/collection';
import {isPresent, isString, isStringMap} from 'angular2/src/facade/lang';
import {AnimationToken, AnimationTokenType} from 'angular2/src/animate/worker/animation_step';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';
import {copy} from 'angular2/src/animate/shared';

export class AnimationStyles {
  private definitions: {[name: string]: CssDefinition[]} = {};
  private _cache: {[name: string]: any} = {};

  constructor(private _resolver: CssMediaQueryResolver, styles: {[key: string]: any}) {
    StringMapWrapper.forEach(styles, (entries, token) => {
      var arr = this.definitions[token] = this.definitions[token] || [];
      entries.forEach((entry) => {
        arr.push(new CssDefinition(entry[0], entry[1]));
      });
    });
  }

  lookupAndResolve(token: AnimationToken): AnimationKeyframe[] {
    var value = token.value;
    var results = this.definitions[value];
    if (!isPresent(results)) {
      throw new BaseException(`unable to resolve CSS token value "${token.value}" from the given component styles`);
    }

    var values: AnimationKeyframe[];
    if (token.type == AnimationTokenType.CSS_KEYFRAME) {
      values = this._resolver.resolveKeyframeDefinition(results);
    } else {
      values = [new AnimationKeyframe('100%', this._resolver.resolveClassDefinition(results))];
    }

    return values;
  }
}
