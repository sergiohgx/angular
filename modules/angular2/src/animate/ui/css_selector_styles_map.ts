import {StringMapWrapper} from 'angular2/src/facade/collection';
import {isPresent, isBlank} from 'angular2/src/facade/lang';
import {pickStyles, fetch} from 'angular2/src/animate/util';
import {CssStylesMediaTuple, CssStylesResolver} from 'angular2/src/animate/ui/css_styles_resolver';

var KEYFRAME_RULE = 7;
var REGULAR_RULE = 1;

function isSimpleSelector(selector: string): boolean {
  var regex = /^\.[-\w]+$/;
  return regex.test(selector);
}

export class CssSelectorStylesMap {
  static fromStylesheet(filePath: string): Promise<CssSelectorStylesMap> {
    return fetch(filePath).then((styles) => {
      return CssSelectorStylesMap.fromStyles(styles);
    });
  }

  static _parseKeyframeRule(styles: any, cssRule: any): void {
    var position = cssRule['keyText'];
    if (position == 'from') position = '0%';
    if (position == 'to') position = '100%';
    styles[position] = CssSelectorStylesMap._fetchStylesFromRule(cssRule);
  }

  static _parseRule(styles: any, cssRule: any, mediaQuery: string = null): void {
    switch (cssRule['type']) {
      case KEYFRAME_RULE:
        CssSelectorStylesMap._parseRuleData(styles, cssRule, '@' + cssRule['name'], true, mediaQuery);
        break;

      case REGULAR_RULE:
        cssRule['selectorText'].split(/\s*,\s*/).forEach((singleSelector) => {
          if (isSimpleSelector(singleSelector)) {
            CssSelectorStylesMap._parseRuleData(styles, cssRule, singleSelector, false, mediaQuery);
          }
        });
        break;
    }
  }

  static _parseRuleData(styles: any,
                        cssRule: any,
                        name: string,
                        keyframe: boolean,
                        mediaQuery: string = null): void {
    var innerStyles;
    if (keyframe) {
      innerStyles = {};
      for (var i = 0; i < cssRule.cssRules.length; i++) {
        CssSelectorStylesMap._parseKeyframeRule(innerStyles, cssRule.cssRules[i]);
      }
    } else {
      var computedStyles = CssSelectorStylesMap._fetchStylesFromRule(cssRule);
      if (!StringMapWrapper.isEmpty(computedStyles)) {
        innerStyles = computedStyles;
      }
    }

    if (isPresent(innerStyles) && !StringMapWrapper.isEmpty(innerStyles)) {
      styles[name] = styles[name] || [];
      innerStyles['media'] = mediaQuery;

      // we either replace the entire keyframe or
      // merge the styles together from the previous entry
      var existingStyles = styles[name];
      for (var i = 0; i < existingStyles.length; i++) {
        let entry = existingStyles[i];
        if (entry.media == mediaQuery) {
          styles[name][i] = keyframe
              ? innerStyles
              : StringMapWrapper.merge(styles[name][i], innerStyles);
          return;
        }
      }

      styles[name].push(innerStyles);
    }
  }

  static fromStyles(cssText: string): CssSelectorStylesMap {
    var styleTag = document.createElement('style');
    styleTag.setAttribute('type','text/css');
    styleTag.innerHTML = cssText;
    document.body.appendChild(styleTag);

    var rules: any[] = styleTag['sheet']['rules'];
    var stylesMap: {[key: string]: any[]} = {};

    var queryBasedRules = [];

    for (var i = 0; i < rules.length; i++) {
      let rule = rules[i];
      if (isPresent(rule['media'])) {
        queryBasedRules.push(rule);
      } else {
        CssSelectorStylesMap._parseRule(stylesMap, rule, 'all');
      }
    };

    queryBasedRules.forEach((rule) => {
      var mediaQueryName = rule['media'][0];
      for (var i = 0; i < rule.cssRules.length; i++) {
        CssSelectorStylesMap._parseRule(stylesMap, rule.cssRules[i], mediaQueryName);
      }
    });

    styleTag.remove();

    return new CssSelectorStylesMap(stylesMap);
  }

  static _fetchStylesFromRule(rule: any): {[key: string]: string} {
    var properties = CssSelectorStylesMap._parsePropertiesFromCss(rule.cssText);
    if (properties.length) {
      var styles = StringMapWrapper.create();
      properties.forEach((property) => {
        CssSelectorStylesMap._parseAndAssignPropertyValue(styles, rule, property);
      });
      return styles;
    }
  }

  static _parseAndAssignPropertyValue(styles, rule, property): void {
    if (property.indexOf('transition') >= 0) {
      var prop = rule.style['transition-property'];
      if (prop == 'all') {
        styles['duration'] = rule.style['transitionDuration'];
        styles['delay']    = rule.style['transitionDelay'];
        styles['easing']   = rule.style['transitionTimingFunction'];
      }
    } else {
      styles[property] = rule.style[property];
    }
  }

  static _parsePropertiesFromCss(rule: string): any[] {
    var firstBrace = rule.indexOf('{');
    var inner = rule.substr(firstBrace);
    var matches = inner.match(/\b[\w-]+(?=:)/g);
    return isPresent(matches) ? matches : [];
  }

  private _values: {[key: string]: CssStylesMediaTuple[]};

  constructor(values: any) {
    this._values = {};
    StringMapWrapper.forEach(values, (entries, exp) => {
      this._values[exp] = entries.map((entry) => {
        var media = entry['media'];
        delete entry['media'];
        return new CssStylesMediaTuple(media, entry);
      });
    });
  }

  lookup(classExp: string): CssStylesMediaTuple[] {
    var matches = this._values[classExp];
    if (!matches || matches.length == 0) {
      var type = classExp[0] == '@' ? 'keyframe' : 'class';
      throw new Error('The CSS ' + type + ' "' + classExp + '" was not found among the provided styles');
    }
    return matches;
  }

  lookupAndResolve(classExp: string, targetMediaQuery: string = null): {[key: string]: any} {
    return new CssStylesResolver(this.lookup(classExp)).resolve(targetMediaQuery);
  }
}
