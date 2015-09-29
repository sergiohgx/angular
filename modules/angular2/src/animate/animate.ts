import {PromiseWrapper} from 'angular2/src/core/facade/async';

var noopTrue = () => true;
var noopPromise = () => PromiseWrapper.wrap(noopTrue);

var elementMatches = (element, selector) => {
  // this is its own function since there are various
  // (prefixed) versions of this for other browser vendors
  return element.matches && element.matches(selector);
}

export function group(callbackFn, eachFn) {
  var queue = [];
  eachFn = eachFn || function() {};

  var _timer, _resolve, _promise;
  return function(element, data) {
    if (!_promise) {
      _promise = new Promise((r) => {
        _resolve = r;
      });
    }
    if (!_timer) {
      window.requestAnimationFrame(() => {
        callbackFn(queue).then(_resolve);
        _timer = false;
        _promise = null;
        queue = [];
      });
      _timer = true;
    }
    eachFn(element, data);
    queue.push([element, data]);
    return _promise;
  };
}

export function parallel(operations) {
  return function(element, event, data) {
    return Promise.all(operations.map((op) => {
      return op(element, event, data);
    }));
  };
}

export function chain(operations) {
  return function(element, event, data) {
    var next;
    operations.forEach((op) => {
      next = next
        ? next.then(() => op(element, event, data))
        : op(element, event, data);
    });
    return next;
  };
}

export function wrap(result): Promise<any> {
  if (result instanceof Promise) return result;
  return PromiseWrapper.wrap(result);
}

function touchCallback(fn) {
  if(fn) {
    fn['touched'] = true;
  }
}

function wrapPrepareCallbackValue(callback, param) {
  return (element, data) => {
    return callback(element, data[param]);
  }
}

export class AnimationQueryContext {
  private _registeredEvents = {};
  private _lookup = {};
  private _container;

  constructor(public selector) {
    this._container = window;
  }

  isSelectorMatch(element) {
    var parent = element;
    while (parent) {
      if (elementMatches(parent, this.selector)) return true;
      parent = parent.parentNode;
    }
    return false;
  }

  trigger(element, event: string, data) {
    if (this.isSelectorMatch(element)) {
      var operations = this._lookup[event];
      if (operations.length) {
        var results = [];
        operations.forEach((op) => {
          if (op.test(element, data)) {
            results.push(wrap(op.fn(element, data)));
          }
        });
        return Promise.all(results);
      }
    }
    return new Promise((r) => {
      if (data['callback']) {
        touchCallback(data['callback']);
        data['callback']();
      }
      r();
    });
  }

  listen(event: string): AnimationQueryContext {
    if (!this._registeredEvents[event]) {
      this._container.addEventListener(event, (e) => {
        var eventData = e.detail || {};
        touchCallback(eventData['callback']);
        var callback = eventData['callback'] || function() { };
        this.trigger(e.target, event, e.detail).then(function() {
          console.log("COMPLETE",callback);
          callback();
        });
      });
      this._registeredEvents[event] = true;
    }
    return this;
  }

  onSwap(callback): AnimationQueryContext {
    return this.on("ng-swap", (element, data) => {
      return callback(data['elements'][0],
               data['elements'][1],
               data['anchors'],
               data['associatedEvents']);
    }, noopTrue);
  }

  onEnter(callback): AnimationQueryContext {
    return this.on("ng-enter", callback, noopTrue);
  }

  onLeave(callback): AnimationQueryContext {
    return this.on("ng-leave", callback, noopTrue);
  }

  onAttrChange(attribute, callback): AnimationQueryContext {
    return this.on("ng-attributeChange", wrapPrepareCallbackValue(callback, 'value'), (element, data) => data.attr == attribute);
  }

  onClassAdd(className, callback): AnimationQueryContext {
    return this.on("ng-addClass", wrapPrepareCallbackValue(callback, 'className'), (element, data) => data.className = className);
  }

  onClassRemove(className, callback): AnimationQueryContext {
    return this.on("ng-removeClass", wrapPrepareCallbackValue(callback, 'className'), (element, data) => data.className = className);
  }

  on(event, callback, predicate = (element, data) => true): AnimationQueryContext {
    this.listen(event);

    // we prefix this so that other JS DOM event code
    // doesn't clash with our renderer system
    this._lookup[event] = this._lookup[event] || [];
    this._lookup[event].push({
      test: predicate,
      fn: callback
    });

    return this;
  }
}

export class AnimationFactory {
  private _queries = [];

  trigger(element: string, event: string, data) {
    return this._queries
      .filter((query) => query.isSelectorMatch(element))
      .map((query) => query.trigger(element, event, data));
  }

  find(selector: string, callback): AnimationFactory {
    var query = new AnimationQueryContext(selector);
    callback(query);
    this._queries.push(query);
    return this;
  }
}

export class AnimationRegistry {
  static registry = [];
  static register(factory: AnimationFactory) {
    AnimationRegistry.registry.push(factory);
  }
}
