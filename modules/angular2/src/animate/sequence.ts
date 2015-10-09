var noop = () => {};

import {CssAnimation} from "./css";
import {RAFRunner} from "./runner";

export function wrapAnimation(fn) {
  return RAFRunner.wrap(fn);
}


export function startAnimation(factory, element, data, duration = null, delay = null) {
  var fn = factory.start ? factory.start : factory;

  // I don't know why I need to use `call`... The scope gets bound to element somehow
  return fn.call(factory, element, duration, delay);
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

  return function startFunction(element, duration = null, delay = null) {
    return RAFRunner.all(animations.map((animation) => {
      return startAnimation(animation, element, {}, duration, delay);
    }));
  };
}

export function chain(operations, duration = null, delay = null) {
  var hasTimings = arguments.length > 2;
  return function startFunction(element, eventData, duration = null, delay = null) {
    var perTaskDuration;
    if (hasTimings) {
      perTaskDuration = operations.length > 1
          ? Math.floor(duration / operations.length)
          : duration;
    }
    return RAFRunner.chain(operations.map((operation, i) => {
      return () => startAnimation(operation, element, {}, perTaskDuration, i == 0 ? delay : null);
    }));
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

  return function queueFn(element, duration = null, delay = null) {
    if (!sharedPromise) {
      sharedPromise = new RAFRunner();
    }
    if (!isPendingTick) {
      isPendingTick = true;
      rafWait(() => {
        isPendingTick = false;
        startAnimation(afterFn, elementQueue, {}).then(() => {
          sharedPromise.resolve();
          sharedPromise = null;
        });
        elementQueue = [];
      });
    }
    startAnimation(beforeFn, element, {}, duration, delay);
    elementQueue.push(element);
    return sharedPromise;
  }
}

export function stagger(animationFactory, staggerDelay, duration = null, delay = null) {
  return group(noop, (elements) => {
    return RAFRunner.all(elements.map((element, index) => {
      return startAnimation(animationFactory, element, {}, duration, (staggerDelay * index) + (delay || 0));
    }));
  });
}

export function query(selector, factory) {
  return function(element, data, duration = null, delay = null) {
    var targets = element.querySelectorAll(selector);
    var queueElement = group(noop, (elements) => {
      return RAFRunner.all(elements.map((elm) => startAnimation(factory, elm, {})));
    });
    var sharedRunner;
    for (var i = 0; i < targets.length; i++) {
      sharedRunner = queueElement(targets[i], duration, delay);
    }
    return sharedRunner;
  };
}
