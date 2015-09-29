import {StringMapWrapper} from 'angular2/src/core/facade/collection';
import {isPresent, isBlank, isArray} from 'angular2/src/core/facade/lang';

import {RAFRunner, CssAnimationRunner} from "./runner";
import {chain, parallel, AnimationEventContext} from "./sequence";
import {
  calculateCoordinates,
  mergeAnimationOptions,
  extractAndRemoveOption
} from "./util";

export class CssAnimation {
  private _immediate: boolean = false;

  constructor(private _options) {}

  merge(newOptions) {
    this._options = mergeAnimationOptions(this._options, newOptions);
    return this;
  }

  setAsImmediate(value: boolean) {
    this._immediate = value;
  }

  public get immediate() {
    return this._immediate;
  }

  start(element, animationContext, duration = null, delay = null) {
    var options = StringMapWrapper.merge(this._options, {});
    options['duration'] = duration || options['duration'];
    options['delay'] = duration || options['delay'];
    return runCssAnimation(element, options, animationContext);
  }
}

function prepareTimingValue(value) {
  return value + "ms";
}

function runCssAnimation(element, options, animationContext) {
  var hasClasses = false;
  var hasStyles = false;
  var trackKeyframes = false;
  var trackTransitions = false;
  var collectedStyles = [];

  var tempClass;
  if (options['tempClass']) {
    tempClass = options['tempClass'];
    element.addClass(tempClass);
    animationContext.queueTempClasses(tempClass.split(' '));
    hasClasses = true;
  }

  var addClass = options['addClass'];
  if (addClass) {
    animationContext.queueTempClasses(addClass.split(' '));
    element.addClass(addClass);
    hasClasses = true;
  }

  var removeClass = options['removeClass'];
  if (removeClass) {
    element.removeClass(removeClass);
    animationContext.queueTempClasses(removeClass.split(' '), true);
    hasClasses = true;
  }

  trackKeyframes = trackTransitions = hasClasses;

  var applyStyles = options['style'];
  if (applyStyles) {
    applyCssStyles(element, applyStyles);
    for (var style in applyStyles) {
      // `true` indicates that we want to REMOVE the style
      animationContext.queueStyle(style, true);
    }
    trackTransitions = hasStyles = true;
  }

  var calculatedDuration = options['duration'];
  var calculatedDelay = options['delay'];

  var applyTransition = hasClasses || hasStyles;
  if (applyTransition) {
    trackTransitions = true;

    if (calculatedDuration) {
      element.style.setProperty('transition-duration', prepareTimingValue(calculatedDuration));
      collectedStyles.push('transition-duration');
    }

    if (calculatedDelay) {
      element.style.setProperty('transition-delay', prepareTimingValue(calculatedDelay));
      collectedStyles.push('transition-delay');
    }
  }

  var applyKeyframe = options['keyframe'];
  if (applyKeyframe) {
    trackKeyframes = true;

    element.style.setProperty('animation-name', options['keyframe']);
    element.style.setProperty('-webkit-animation-name', options['keyframe']);

    if (calculatedDuration) {
      element.style.setProperty('animation-duration', prepareTimingValue(calculatedDuration));
      collectedStyles.push('animation-duration');
      element.style.setProperty('-webkit-animation-duration', prepareTimingValue(calculatedDuration));
      collectedStyles.push('-webkit-animation-duration');
    }

    if (calculatedDelay) {
      element.style.setProperty('animation-delay', prepareTimingValue(calculatedDelay));
      collectedStyles.push('animation-delay');
      element.style.setProperty('-webkit-animation-delay', prepareTimingValue(calculatedDelay));
      collectedStyles.push('-webkit-animation-delay');
    }

    element.style.setProperty('animation-fill-mode', 'forwards');
    element.style.setProperty('-webkit-animation-fill-mode', 'forwards');

    animationContext.queueKeyframe();
  }

  var runner = new CssAnimationRunner();

  if (calculatedDuration > 0 && (trackTransitions || trackKeyframes)) {
    var trackEvents = [];

    if (trackTransitions) {
      trackEvents.push('transitionend');
    }

    if (trackKeyframes) {
      trackEvents.push('animationend');
      trackEvents.push('webkitAnimationEnd');
    }

    var onComplete = function() {
      trackEvents.forEach((event) => {
        element.removeEventListener(event, onComplete);
      });
      collectedStyles.forEach((style) => {
        element.style.removeProperty(style);
      });
      runner.resolve();
    }

    trackEvents.forEach((event) => {
      element.addEventListener(event, onComplete);
    });
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
export function reflow() {
  return function(element) {
    element.clientWidth + 1;
  }
}

export function transition(styles, duration = null, delay = null) {
  return new CssAnimation(
    mergeAnimationOptions(
      {},
      { style: styles },
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
  var animator = new CssAnimation({ style: value, duration: 0, delay: 0 });
  animator.setAsImmediate(true);
  return animator;
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

export function objectToCss(object) {
  var css = '';
  for (var prop in object) {
    css += prop + ':' + object[prop] + ';';
  }
  return css;
}

export function keyframeObjectToCss(name, object) {
  var css = '@keyframes ' + name + " {\n";
  for (var step in object) {
    css += "  " + step + ' {' + objectToCss(object[step]) + "}\n";
  }
  css += "}\n";
  return css;
}

var sharedStyleTag;
function getSharedStyleTag() {
  if (!sharedStyleTag) {
    var sharedStyleTag = document.createElement('style');
    sharedStyleTag.type = 'text/css';
    document.querySelector('head').appendChild(sharedStyleTag);
  }
  return sharedStyleTag;
}

var keyframeLookup = new Map();
var keyframeLookupCount = 0;
function createKeyframeAnimationFromObject(object) {
  var name = keyframeLookup.get(object);
  if (!name) {
    name = 'ng-animate-' + ++keyframeLookupCount;
    var cssCode = keyframeObjectToCss(name, object);
    var styleTag = getSharedStyleTag();
    styleTag.innerHTML += cssCode;
    keyframeLookup.set(object, name);
  }
  return name;
}

export function keyframe(factory, duration = null, delay = null) {
  var keyframeName, hasTempKeyframe;
  if (typeof factory == 'object') {
    keyframeName = createKeyframeAnimationFromObject(factory);
    hasTempKeyframe = true;
  } else {
    keyframeName = factory;
  }

  // TODO: remember to cleanup the temp keyframe
  return new CssAnimation({
    keyframe: keyframeName,
    duration: duration,
    delay: delay
  });
}
