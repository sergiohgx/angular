import {chain} from "./sequence.ts";

class CssAnimation {
  private _options;

  constructor(private _options) {
  }

  merge(newOptions) {
    this._options = mergeAnimationOptions(this._options, newOptions);
    return this;
  }

  afterComplete() {
  }

  start(element, duration, delay) {
  }
}

interface AnimationPromise {
  public then();
  public finally();
  public catch();
}

interface AnimationRunner extends AnimationPromise {
  public pause();
  public resume();
  public close();
  public isPaused();
  public isClosed();
}

class RAFRunner implements AnimationPromise {
  private _promise;
  private _resolvePromise;
  private _runnerResolved;
  private _resolved;
  private _rafResolved;

  static chain(operations) {
    var head;
    operations.forEach((operation) => {
      if (head) {
        head = head.then(operation);
      } else {
        head = operation();
      }
    });
    return head ? RAFRunner.wrap(head) : RAFRunner.when(true);
  }

  static when(value) {
    var promise = new RAFPromise();
    promise.resolve(value);
    return promise;
  }

  static wrap(value) {
    if (value instanceof RAFRunner) {
      return value;
    }

    if (value instanceof Promise) {
      return value.then(() => RAFRunner.when(true);
    }

    return RAFRunner.when(value);
  }

  static all(runners) {
    var count = 0;
    var runnerWrapper = new RafRunner();

    runners.forEach((runner) => {
      runner.then(progress);
    });

    return runnerWrapper;

    function progress() {
      if (++count == runners.length) {
        runnerWrapper.resolve();
      }
    }
  }

  public constructor() {
    this._promise = new Promise((resolve) => this._resolvePromise = resolve);
    window.requestAnimationFrame(() => this._onRAF());
  }

  public resolve() {
    this._runnerResolved = true;
    if (this._rafResolved) {
      this._resolve();
    }
  }

  private _onRAF() {
    this._rafResolved = true;
    if (this._runnerResolved) {
      this._resolve();
    }
  }

  public _resolve() {
    this._resolvePromise();
    this._resolved = true;
  }

  get resolved() {
    return this._resolved;
  }

  public then(c1, c2) => this._promise.then(c1, c2);
  public catch(callback) => this._promise.catch(callback);
  public finally(callback) => this._promise.finally(callback);
}

class CssAnimationRunner extends RAFRunner implements AnimationRunner {
  private _paused;

  public close() => this.resolve();
  public isClosed() => this.resolved;
  public pause() => this._paused = true;
  public resume() => this._paused = false;
  public isPaused() => this._paused;
}

function mergeAnimationOptions(optionsA, optionsB, duration, delay) {
  var options = StringMapWrapper.merge(optionsA, optionsB);
  if (duration != null) {
    options.duration = duration;
  }
  if (delay != null) {
    options.delay = delay;
  }
  return options;
}

function css(expression, duration, delay) {
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

    tokens.forEach((expression.split(" ")) => {
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

function extractAndRemoveOption(object, key) {
  var value = object[key];
  delete object[key];
  return value;
}

function calculateCoordinates(element) {
  var props = element.getBoundingBox();
  var values = {};

  // these properties are traversed explicitely since
  // the bounding box object is lazy and each browser
  // reveals the properties differently...
  ['top','left','height','width'].forEach((prop) => {
    values[prop] = props[prop] + "px";
  });
  return values;
}

function anchor(options, duration, delay) {
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

  return function startFunction(element, duration, delay) {
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
    ]).start(element, duration, delay).then(() => {
      cloneElement.remove();
      fromElement.removeClass(ANCHOR_SHIM_CLASSNAME);
      toElement.removeClass(ANCHOR_SHIM_CLASSNAME);
    });
  };
}

function transition(from, to, options, duration, delay) {
  return new CssAnimation(mergeAnimationOptions(
    options,
    { from, to },
    duration,
    delay));
}

function keyframe(name, options, duration, delay) {
  return new CssAnimation(mergeAnimationOptions(
    options,
    { keyframeAnimation: name },
    duration,
    delay));
}

function style(cssProperties, value) {
  var value = arguments.length == 2
      ? { [cssProperties]: value },
      : cssProperties;
  value.duration = value.delay = 0;
  return new CssAnimation(value);
}

function addClass(className, duration, delay) {
  return new CssAnimation(mergeAnimationOptions(
    {},
    { addClass: className },
    duration,
    delay));
}

function removeClass(className, duration, delay) {
  return new CssAnimation(mergeAnimationOptions(
    {},
    { removeClass: className },
    duration,
    delay));
}

function setClass(addClass, removeClass, duration, delay) {
  return new CssAnimation({addClass,removeClass,duration,delay});
}

function setTempClass(addClass, removeClass, duration, delay) {
  return new CssAnimation({
    tempAddClass: addClass,
    tempRemoveClass: removeClass,
    duration: duration,
    delay: delay
  });
}

function ng1AddRemoveClass(add, remove, duration, delay) {
  var preAddClasses = suffixClasses(add, "-add");
  var postAddClasses = suffixClasses(add, "-add-active");

  var preRemoveClasses = suffixClasses(remove, "-remove");
  var postRemoveClasses = suffixClasses(remove, "-remove-active");

  return chain([
    setTempClass(preAddClasses, preRemoveClasses, 0, 0),
    parallel([
      setClass(add, remove),
      setTempClass(postAddClasses, postRemoveClasses)
    ], duration, delay)
  ]);
}

function ng1AddClass(className, duration, delay) {
  return ng1AddRemoveClass(className, null, duration, delay);
}

function ng1Removelass(className, duration, delay) {
  return ng1AddRemoveClass(null, className, duration, delay);
}

function ng1AnimateEvent(className, duration, delay) {
  return chain([
    addClass(className, 0, 0),
    addClass(className + '-active', duration, delay)
  ]);
}

function suffixClasses(className, suffix) {
  if (className) {
    return className.split(' ').map((className) => className + suffix).join(' ');
  }
}

function parseTimingValue(value, name) {
  var convertedValue;
  switch (typeof value) {
    case "string":
      var lastChar = value[value.length - 1];
      if (lastChar == "s") {
        var secondLastChar = value[value.length - 2];
        if (secondLastChar == "m") { //ms
          convertedValue = parseInt(value.substring(0, value.length - 2), 10);
        } else {
          convertedValue = parseInt(value.substring(0, value.length - 1), 10) * 1000;
        }
      } else {
        error();
      }
      break;

    case "number":
      convertedValue = value;
      break;

    default: error();
  }

  return convertedValue;

  function error() {
    throw new Error("timing value for " + name + " must be in the format of: 10s, 10ms or 1000");
  }
}
