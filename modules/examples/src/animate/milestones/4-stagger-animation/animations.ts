import {AnimationFactory} from 'angular2/src/animate/animate';
import {group} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

function reverseStagger(delay) {
  return (i, total) => {
    return (total - i) * delay;
  };
}

function forwardStagger(delay) {
  return (i, total) => {
    return i * delay;
  };
}

function insideOutStagger(delay) {
  return (i, total) => {
    return Math.abs(i - (total / 2)) * delay;
  }
}

function outsideInStagger(delay) {
  return (i, total) => {
    return (total - Math.abs(i - (total / 2))) * delay;
  }
}

animations.add('tr', (ctx) => {
  ctx.onEnter(staggerCss('ng-enter', outsideInStagger(100)));
  ctx.onLeave(staggerCss('ng-leave', insideOutStagger(100)));
});

function staggerCss(className, delayValue) {
  var delay = delayValue;
  if (typeof delay != "function") {
    delay = (i) => {
      return delayValue * i;
    }
  }
  return group(
    (records) => {
      document.body.clientWidth + 1;
      var elements = records.map((record) => record[0]);
      var promises = elements.map((element, i) => applyStagger(element, className, delay(i, elements.length)));
      return Promise.all(promises).then(() => {
        elements.map((element) => {
          element.classList.remove(className);
          element.classList.remove(className + '-active');
        });
      });
    },
    (element) => beforeStagger(element, className)
  );
}

function beforeStagger(element, event) {
  element.classList.add(event);
  element.style.setProperty("transition-delay", "-9999s");
}

function applyStagger(element, event, timeout) {
  return new Promise((resolve) => {
    element.style.removeProperty("transition-delay");
    setTimeout(() => {
      element.classList.add(event + "-active");
      element.addEventListener("transitionend", onTransEnd);
    }, timeout);

    function onTransEnd() {
      element.removeEventListener("transitionend", onTransEnd);
      resolve();
    }
  })
}
