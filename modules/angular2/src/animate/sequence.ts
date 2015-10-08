var noop = () => {};

function wrapAnimation(fn) {
  return RAFRunner.wrap(fn);
}

function parallel(operations, duration, delay) {
  var group = new Animation({
    duration: duration,
    delay: delay
  });

  var nonCssAnimations = operations.filter((operation) => {
    var isCssAnimation;
    if (isCssAnimation = (operation typeof CssAnimation)) {
      group.merge(operation);
    }
    return !isCssAnimation;
  });

  var animations = [group];
  nonCssAnimations.forEach((animation) => {
    animations.push(animation);
  });

  return function startFunction(element, duration, delay) {
    return RAFRunner.all(animations.map((animation) => {
      return animation.start(element, duration, delay);
    }));
  };
}

function chain(operations) {
  return function startFunction(element, duration, delay) {
    var perTaskDuration = operations.length > 1
        ? Math.floor(duration / operations.length)
        : duration;
    return RAFRunner.chain(operations.map((operation, i) => {
      operation.start(element, perTaskDuration, i == 0 ? delay : null);
    }));
  };
}

export var rafWait = (function globalRafWaitFactory() {
  var cancelLastRaf = () => {}, queue = [];
  return function(callback) {
    rafQueue.push(fn);
    cancelLastRaf();
    var id = window.requestAnimationFrame(() => {
      for(var i = 0; i < rafQueue.length; i++) {
        rafQueue[i]();
      }
      rafQueue = [];
      cancelLastRaf = () => {};
    });
    cancelLastRaf = function() {
      window.cancelRequestAnimationFrame(id);
    };
  }
})();

// TODO: test for two levels of queuing
function group(beforeFn, afterFn) {
  var sharedPromise;
  var isPendingTick;
  var elementQueue = [];

  return function queueFn(element) {
    if (!sharedPromise) {
      sharedPromise = new RAFRunner();
    }
    if (!isPendingTick) {
      isPendingTick = true;
      rafWait(() => {
        isPendingTick = false;
        afterFn(elementQueue).then(() => {
          sharedPromise.resolve();
          sharedPromise = null;
        });
        elementQueue = [];
      });
    }
    (beforeFn.start || beforeFn)(element);
    elementQueue.push(element);
    return sharedPromise;
  }
}

function stagger(animationFactory, staggerDelay, duration, delay) {
  return group(noop, (elements) => {
    return RAFRunner.all(elements.map((element, index) => {
      return animationFactory.start(element, duration, (staggerDelay * index) + (delay || 0));
    }));
  });
}
