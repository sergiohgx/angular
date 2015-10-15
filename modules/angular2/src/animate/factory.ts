import {PromiseWrapper} from 'angular2/src/core/facade/async';
import {isArray} from 'angular2/src/core/facade/lang';
import {chain, parallel, wrapAnimation, startAnimation, AnimationEventContext} from './sequence';
import {RAFRunner} from './runner';

var noopTrue = () => true;
var noopPromise = () => PromiseWrapper.wrap(noopTrue);

var elementMatches = (element, selector) => {
  // this is its own function since there are various
  // (prefixed) versions of this for other browser vendors
  return element.matches && element.matches(selector);
}

export function touchCallback(fn) {
  if(fn) {
    fn['touched'] = true;
  }
}

function wrapPrepareCallbackValue(callback, param) {
  return (element, data) => {
    if (callback.start) {
      return callback.start(element, data);
    } else {
      return callback(element, data[param], data);
    }
  };
}

export class AnimationQueryContext {
  private _registeredEvents = {};
  private _lookup = {};
  private _container;
  private _lastClickEvent;

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

  trigger(element, event, data) {
    var callback = data['callback'] || noopTrue;
    touchCallback(callback);

    if (this.isSelectorMatch(element)) {
      var operations = this._lookup[event];
      if (operations.length) {
        var results = [];
        operations.forEach((op) => {
          if (op.test(element, data)) {
            if (this._lastClickEvent) {
              data['collectedEvents'].push(this._lastClickEvent);
            }

            var context = new AnimationEventContext(element, data);
            var animation = wrapAnimation(op.fn(element, context)).then(() => {
              this._lastClickEvent = null;
              context.flush();
            });
            results.push(animation);
          }
        });
        return RAFRunner.all(results).then(callback);
      }
    }
    return RAFRunner.when(true).then(callback);
  }

  listen(event: string): AnimationQueryContext {
    if (this._registeredEvents[event]) return this;

    this._container.addEventListener(event, (e) => {
      var eventData = e.detail || {};
      touchCallback(eventData['callback']);
      var callback = eventData['callback'] || function() { };

      this.trigger(e.target, event, eventData).then(callback);
    });

    this._registeredEvents[event] = true;
    return this;
  }

  onSwap(callback): AnimationQueryContext {
    var startFn;
    if (typeof callback == "function") {
      startFn = function(container, data) {
        var leave = data['elements'][0];
        var enter = data['elements'][1];
        var anchors = data['anchors'];
        return callback(leave, enter, anchors, data);
      }
    } else {
      startFn = function(container, data) {
        var leaveElm = data['elements'][0];
        var enterElm = data['elements'][1];
        var order = callback['order'];

        var operations = {
          enter: function() { return startAnimation(callback['enter'], enterElm, {}); },
          leave: function() { return startAnimation(callback['leave'], leaveElm, {}); }
        };

        if (callback['enterSetup']) {
          startAnimation(callback['enterSetup'], enterElm, {}, 0);
        }

        if (callback['leaveSetup']) {
          startAnimation(callback['leaveSetup'], leaveElm, {}, 0);
        }

        if (isArray(order)) {
          return RAFRunner.chain([
            operations[order[0]],
            operations[order[1]]
          ]);
        } else {
          return RAFRunner.all([
            operations['enter'](),
            operations['leave'](),
          ]);
        }
      };
    }

    return this.on("ng-swap", startFn, noopTrue);
  }

  onStyle(callback): AnimationQueryContext {
    return this.on("ng-style", callback, noopTrue);
  }

  onEnter(callback): AnimationQueryContext {
    return this.on("ng-enter", callback, noopTrue);
  }

  onLeave(callback): AnimationQueryContext {
    return this.on("ng-leave", callback, noopTrue);
  }

  trackClick(): void {
    document.body.addEventListener('mousedown', (event) => {
      this._lastClickEvent = event;
    });
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

  trigger(element, event, data) {
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
