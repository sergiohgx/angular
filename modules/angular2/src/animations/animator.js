import {DOM} from 'angular2/src/dom/dom_adapter';

function setStyle(element, prop, value) {
  DOM.setStyle(element, prop, value);
}

function removeStyle(element, prop) {
  DOM.removeStyle(element, prop);
}

function addClass(element, className) {
  DOM.addClass(element, className);
}

function removeClass(element, className) {
  DOM.removeClass(element, className);
}

function parseTime(time) {
  return parseFloat(time, 10);
}

export var animator = {
  insert: function(element, pos) {
    var animation = new CssAnimation(element, 'enter');
    DOM.insertAfter(pos, element);
    animation.start();
  },

  leave: function(element, parent) {
    var animation = new CssAnimation(element, 'leave');
    animation.start().then(function() {
      DOM.removeChild(parent, element);
    });
  }
}

export class CssAnimation {
  constructor(element, event) {
    this.element = element;
    this.event = event;

    this.setupClass = 'ng-' + event;
    this.activeClass = 'ng-' + event + '-active';
  }

  hasAnimation() {
    var cs = window.getComputedStyle(this.element);
    var trans = parseTime(cs.transitionDuration);
    var keys = parseTime(cs.animationDuration);
    return trans > 0 || keys > 0;
  }

  start() {
    var self = this;
    addClass(self.element, self.setupClass);
    setStyle(self.element, 'transition-delay', '-9999s');

    if (this.hasAnimation()) {
      removeStyle(self.element, 'transition-delay');
      window.requestAnimationFrame(function() {
        addClass(self.element, self.activeClass);
        self.element.addEventListener('transitionend', self.close.bind(self));
      });
    } else {
      this.close();
    }

    return new Promise(function(resolve, reject) {
      self._resolve = resolve;
      self._reject = reject;
    });
  }

  close() {
    removeClass(this.element, this.setupClass);
    removeClass(this.element, this.activeClass);
    this._resolve();
  }
}
