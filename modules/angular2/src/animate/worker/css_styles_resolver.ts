import {Injectable} from 'angular2/core';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {CssDefinition} from 'angular2/src/animate/worker/css_definition';
import {isPresent} from 'angular2/src/facade/lang';
import {AnimationKeyframe} from 'angular2/src/animate/animation_keyframe';

export class CssStylesResolver {
  resolveStyles(definitions: CssDefinition[]): {[key: string]: any} {
    var styles = {};
    definitions.forEach((def) => {
      // TODO (matsko): bring back support for media queries
      var allow = !isPresent(def.mediaQuery) || def.mediaQuery == 'all';
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
      var allow = !isPresent(def.mediaQuery) || def.mediaQuery == 'all';
      if (allow) {
        chosenDef = def;
      }
    });

    var keyframes = [];
    if (isPresent(chosenDef)) {
      StringMapWrapper.forEach(chosenDef['styles'], (positionStyles, position) => {
        keyframes.push(new AnimationKeyframe(position, positionStyles));
      });
    }

    return keyframes;
  }
}
