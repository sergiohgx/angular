import {AnimationFactory} from 'angular2/src/animate/animate';
import {group} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

animations.find('animate-app', (ctx) => {

  ctx.onSwap((element1, element2) => {
    element1.classList.add("ng-leave");
    element2.classList.add("ng-enter");

    var a = animateLeave(element1);
    var b = animateEnter(element2);
    return Promise.all([a,b]).then(() => {
      element2.classList.remove("ng-enter");
      element2.classList.remove("ng-enter-active");
    });
  });

  function animateCss(element, className) {
    return new Promise((r) => {
      window.requestAnimationFrame(() => {
        element.clientWidth + 1;
        element.classList.add(className);
        element.addEventListener("transitionend", () => {
          r();
        });
      });
    });
  }

  function animateLeave(element) {
    element.classList.add("ng-leave");
    return animateCss(element, "ng-leave-active");
  }

  function animateEnter(element) {
    element.classList.add("ng-enter");
    return animateCss(element, "ng-enter-active");
  }
});
