import {StringMapWrapper} from 'angular2/src/core/facade/collection';
import {isPresent, isBlank, isArray} from 'angular2/src/core/facade/lang';

import {RAFRunner, CssAnimationRunner} from "./runner";
import {chain, parallel} from "./sequence";
import {
  calculateCoordinates,
  mergeAnimationOptions,
  extractAndRemoveOption
} from "./util";

export class CssAnimation {
  constructor(private _options) {}

  merge(newOptions) {
    this._options = mergeAnimationOptions(this._options, newOptions);
    return this;
  }

  start(element, eventData, duration = null, delay = null) {
    var options = StringMapWrapper.merge(this._options, {});
    options['duration'] = duration || options['duration'];
    options['delay'] = duration || options['delay'];
    return runCssAnimation(element, options);
  }
}

function runCssAnimation(element, options) {
  var tempClass;
  var calculatedDuration = 0;
  var calculatedDelay = 0;

  if (options['tempClass']) {
    tempClass = options['tempClass'];
    element.addClass(tempClass);
  }

  if (options['addClass']) {
    element.addClass(options['addClass']);
  }

  if (options['removeClass']) {
    element.removeClass(options['removeClass']);
  }

  if (calculatedDuration = options['duration']) {
    element.style['transitionDuration'] = calculatedDuration + "ms";
  }

  if (calculatedDelay = options['delay']) {
    element.style['transitionDelay'] = calculatedDelay + "ms";
  }

  if (options['style']) {
    applyCssStyles(element, options['style']);
  }

  var runner = new CssAnimationRunner();

  if (calculatedDuration > 0) {
  console.log(element.getAttribute('style'), options);
    var onComplete = function() {
      element.removeEventListener('transitionend', onComplete);
      runner.resolve();
    }

    element.addEventListener('transitionend', onComplete);
  } else {
    runner.resolve();
  }

  return runner;
}

function applyCssStyles(element, styles) {
  for (var prop in styles) {
    element.style.setProperty(prop, styles[prop]);
  }
}

export function css(expression, duration = null, delay = null) {
  var CSS_TEMP_CLASS_SYMBOL = ".";
  var CSS_ADD_CLASS_SYMBOL = "+";
  var CSS_REMOVE_CLASS_SYMBOL = "-";
  var CSS_KEYFRAME_SYMBOL = "@";
  var APPLY_IMMEDIATELY_SYMBOL = "!";

  var expressions = isArray(expression)
      ? expression
      : [expression];

  var operations = expressions.map((expression) => {
    var durationValue;
    var addClasses = [];
    var removeClasses = [];
    var tempClasses = [];
    var tempKeyframes = [];

    expression.split(" ").forEach((token) => {
      var value = token.substr(1);
      var firstChar = token[0];
      var lastChar = token[token.length - 1];

      if (lastChar == APPLY_IMMEDIATELY_SYMBOL) {
        value = value.substring(0, value.length - 1);
        durationValue = durationValue == null ? 0 : durationValue;
      }

      switch (firstChar) {
        case CSS_ADD_CLASS_SYMBOL:
          addClasses.push(value);
          break;

        case CSS_REMOVE_CLASS_SYMBOL:
          removeClasses.push(value);
          break;

        case CSS_TEMP_CLASS_SYMBOL:
          tempClasses.push(value);
          break;

        case CSS_KEYFRAME_SYMBOL:
          tempKeyframes.push(value);
          break;

        default:
          throw new Error("please include a CSS class and/or a krame value");
          break;
      }
    });

    return new CssAnimation({
      addClass: addClasses,
      removeClasses: removeClasses,
      tempClasses: tempClasses,
      tempKeyframes: tempKeyframes
    });
  });

  return chain(operations, duration, delay);
}

/*
function anchor(options, duration = null, delay = null) {
  var ANCHOR_SHIM_CLASSNAME = "ng-anchor-shim";
  var ANCHOR_OUT_CLASSNAME = "ng-anchor-out";
  var ANCHOR_IN_CLASSNAME = "ng-anchor-in";
  var ANCHOR_CLASSNAME = "ng-anchor";

  var fromElement = extractAndRemoveOption(options, 'from');
  var toElement = extractAndRemoveOption(options, 'from');
  var cloneFn = extractAndRemoveOption(options, 'clone');
  if (typeof cloneFn != "function") {
    cloneFn = function(fromElement, toElement) {
      return document.cloneNode(true);
    }
  }

  return function startFunction(element, duration = null, delay = null) {
    fromElement.addClass(ANCHOR_SHIM_CLASSNAME);
    toElement.addClass(ANCHOR_SHIM_CLASSNAME);

    return chain([
      parallel([
        addClass(ANCHOR_CLASSNAME, 0, 0),
        style(calculateCoordinates(fromElement),
      ]),
      addClass(ANCHOR_OUT_CLASSNAME),
      parallel([
        removeClass(ANCHOR_OUT_CLASSNAME),
        tempClass(ANCHOR_IN_CLASSNAME),
        transition(calculateCoordinates(toElement))
      ])
    ]).start(element, {}, duration, delay).then(() => {
      cloneElement.remove();
      fromElement.removeClass(ANCHOR_SHIM_CLASSNAME);
      toElement.removeClass(ANCHOR_SHIM_CLASSNAME);
    });
  };
}
*/

export function transition(from, to, duration = null, delay = null) {
  var operations = [];
  if (from && Object.keys(from).length > 0) {
    operations.push(style(from));
  }

  operations.push(
    new CssAnimation(
      mergeAnimationOptions(
        {},
        { style: to },
        duration,
        delay
      )));

  return chain(operations);
}

export function keyframe(name, options, duration = null, delay = null) {
  return new CssAnimation(mergeAnimationOptions(
    options,
    { keyframeAnimation: name },
    duration,
    delay));
}

export function style(cssProperties, value = null) {
  if (arguments.length == 2) {
    var data = {};
    data[cssProperties] = value;
    value = data;
  } else {
    value = cssProperties;
  }
  return new CssAnimation({ style: value, duration: 0, delay: 0 });
}

export function tempClass(className, duration = null, delay = null) {
  return this.addClass(className, duration, delay);
}

export function addClass(className, duration = null, delay = null) {
  return new CssAnimation(mergeAnimationOptions(
    {},
    { addClass: className },
    duration,
    delay));
}

export function removeClass(className, duration = null, delay = null) {
  return new CssAnimation(mergeAnimationOptions(
    {},
    { removeClass: className },
    duration,
    delay));
}

export function setClass(addClass, removeClass, duration = null, delay = null) {
  return new CssAnimation({addClass,removeClass,duration,delay});
}

export function setTempClass(addClass, removeClass, duration = null, delay = null) {
  return new CssAnimation({
    tempAddClass: addClass,
    tempRemoveClass: removeClass,
    duration: duration,
    delay: delay
  });
}
