var noop = () => {};

import {CssAnimation} from "./css";
import {RAFRunner} from "./runner";
import {touchCallback} from "./factory";

export function wrapAnimation(fn) {
  return RAFRunner.wrap(fn);
}

export class AnimationEventContext {
  private _styles = [];
  private _classes = [];

  public constructor(private _element, private _data = {}) {}

  // this is used to emulate an event
  public get detail() {
    return this._data;
  }

  public fetchAndBlockInnerEvents () {
    return this._data['collectedEvents'].map((event) => {
      touchCallback(event['callback']);
      return event;
    });
  }

  public queueStyles(styles) {
    for (var i in styles) {
      this.queueStyle(i, styles[i]);
    }
  }

  public queueStyle(key, value) {
    this._styles.push({
      'prop': key,
      'value': value
    });
  }

  public queueTempClasses(classes, remove = false) {
    classes.forEach((className) => this.queueTempClass(className, remove));
  }

  public queueTempClass(className, remove = false) {
    this._classes.push({
      className: className,
      remove: remove
    });
  }

  public queueKeyframe() {
    this.queueStyle('animation-fill-mode', true);
    this.queueStyle('-webkit-animation-fill-mode', true);
    this.queueStyle('animation', true);
    this.queueStyle('-webkit-animation', true);
  }

  public flush() {
    this._classes.forEach((entry) => {
      var className = entry['className'];
      this._element.classList[entry.remove ? 'remove' : 'add'](className);
    });

    this._styles.forEach((record) => {
      var value = record['value'];
      var prop = record['prop'];
      if (value === true) {
        this._element.style.removeProperty(prop);
      } else {
        this._element.style.setProperty(prop, value);
      }
    });

    this._styles = [];
    this._classes = [];
  }
}

export var DEFAULT_STAGGER_TIME = 100;

export var staggerTimers = {
  reverse: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var relativeIndex = Array.prototype.indexOf.call(element.parentNode.children, element);
      return (total - relativeIndex) * delay;
    }
  },

  forward: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var relativeIndex = Array.prototype.indexOf.call(element.parentNode.children, element);
      return relativeIndex * delay;
    }
  },

  middleOut: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var midIndex = Math.floor(total / 2);
      var relativeIndex = Array.prototype.indexOf.call(element.parentNode.children, element);
      var diff = Math.abs(relativeIndex - midIndex);
      return diff * delay;
    }
  },

  topDownDiagonal: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var cellWidth = element.clientWidth;
      var cellHeight = element.clientHeight;
      var leftIndex = Math.floor(element.offsetLeft / cellWidth);
      var topIndex = Math.floor(element.offsetTop / cellHeight);
      return Math.max(leftIndex, topIndex) * delay;
    };
  },

  middleOutDiagonal: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var container       = element.parentNode;
      var cellWidth       = element.clientWidth;
      var cellHeight      = element.clientHeight;
      var containerWidth  = container.clientWidth;
      var containerHeight = container.clientHeight;
      var leftIndex       = Math.floor(element.offsetLeft / cellWidth);
      var topIndex        = Math.floor(element.offsetTop / cellHeight);
      var rightIndex      = Math.floor((containerWidth - element.offsetLeft) / cellWidth);
      var bottomIndex     = Math.floor((containerHeight - element.offsetTop) / cellHeight);
      return Math.max(leftIndex, topIndex, rightIndex, bottomIndex) * delay;
    };
  },

  rightToLeft: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var container = element.parentNode;
      var width = container.clientWidth;
      var cellWidth = element.clientWidth;
      var rightIndex = Math.floor((width - element.offsetLeft) / cellWidth);
      return rightIndex * delay;
    };
  },

  leftToRight: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var cellWidth = element.clientWidth;
      var leftIndex = Math.floor(element.offsetLeft / cellWidth);
      return leftIndex * delay;
    };
  },

  zoneIn: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var midIndex = Math.floor(total / 2);
      var relativeIndex = Array.prototype.indexOf.call(element.parentNode.children, element);
      var diff = Math.abs(relativeIndex - midIndex);
      return (midIndex - diff) * delay;
    };
  }
};

export function startAnimation(factory, element, context, duration = null, delay = null) {
  var fn = factory.start ? factory.start : factory;

  // I don't know why I need to use `call`... The scope gets bound to element somehow
  return fn.call(factory, element, context, duration, delay);
}

export function parallel(operations, duration = null, delay = null) {
  var group = new CssAnimation({
    duration: duration,
    delay: delay
  });

  var nonCssAnimations = operations.filter((operation) => {
    var isCssAnimation = operation instanceof CssAnimation;
    if (isCssAnimation) {
      group.merge(operation);
    }
    return !isCssAnimation;
  });

  var animations = [group];
  nonCssAnimations.forEach((animation) => {
    animations.push(animation);
  });

  return function startFunction(element, context, duration = null, delay = null) {
    return RAFRunner.all(animations.map((animation) => {
      return startAnimation(animation, element, context, duration, delay);
    }));
  };
}

export function chain(operations, duration = null, delay = null) {
  var hasTimings = arguments.length > 2;
  return {
    start: function(element, context, duration = null, delay = null) {
      var perTaskDuration;
      if (hasTimings) {
        perTaskDuration = operations.length > 1
            ? Math.floor(duration / operations.length)
            : duration;
      }
      return RAFRunner.chain(operations.map((operation, i) => {
        return () => startAnimation(operation, element, context, perTaskDuration, i == 0 ? delay : null);
      }));
    }
  };
}

export var rafWait = (function globalRafWaitFactory() {
  var cancelLastRaf = () => {}, queue = [];
  return function(callback) {
    queue.push(callback);
    cancelLastRaf();
    var id = window.requestAnimationFrame(() => {
      for(var i = 0; i < queue.length; i++) {
        queue[i]();
      }
      queue = [];
      cancelLastRaf = () => {};
    });
    cancelLastRaf = function() {
      window.cancelAnimationFrame(id);
    };
  }
})();

// TODO: test for two levels of queuing
export function group(beforeFn, afterFn) {
  var sharedPromise;
  var isPendingTick;
  var elementQueue = [];
  var contextQueue = [];

  return function queueFn(element, context, duration = null, delay = null) {
    if (!sharedPromise) {
      sharedPromise = new RAFRunner();
    }
    if (!isPendingTick) {
      isPendingTick = true;
      rafWait(() => {
        isPendingTick = false;
        startAnimation(afterFn, elementQueue, contextQueue).then(() => {
          sharedPromise.resolve();
          sharedPromise = null;
        });
        elementQueue = [];
      });
    }
    startAnimation(beforeFn, element, context, duration, delay);
    elementQueue.push(element);
    contextQueue.push(context);
    return sharedPromise;
  }
}

export function stagger(animationFactory, staggerDelay, duration = null, delay = null) {
  delay = typeof delay == "number" ? delay : null;
  var delayFn = typeof staggerDelay == 'function'
    ? staggerDelay
    : (element, index, total) => {
      return index * staggerDelay;
    };

  return group(noop, (elements, contexts) => {
    return RAFRunner.all(elements.map((element, index) => {
      return wait(delayFn(element, index, elements.length)).then(() => {
        return startAnimation(animationFactory, element, contexts[index], duration, null);
      });
    }));
  });
}

export function wait(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export function query(selector, factory) {
  return function(element, data, duration = null, delay = null) {
    var contexts = [];
    var targets = element.querySelectorAll(selector);
    var queueElement = group(noop, (elements, contexts) => {
      return RAFRunner.all(elements.map((elm, index) => startAnimation(factory, elm, contexts[index])));
    });
    var sharedRunner;
    for (var i = 0; i < targets.length; i++) {
      var newTarget = targets[i];
      var newContext = new AnimationEventContext(newTarget);
      sharedRunner = queueElement(newTarget, newContext, duration, delay);
    }
    return sharedRunner;
  };
}
