import {NgZone} from 'angular2/src/core/zone';
import {Injectable} from 'angular2/src/core/di';

export class AnimatorEventsFilter {

  _registry = [];
  _parentMap = new Map();

  constructor(entries = []) {
    entries.forEach((entry) => this.add(entry));
  }

  add(entry) {
    var node = entry['node'];
    var event = entry['event'];
    var parent = node.parentNode;
    if (this._isStructuralEvent(event)) {
      var candidateEvent = this._parentMap.get(parent);
      var isOppositeEvent = candidateEvent &&
                            candidateEvent['event'] == (event == "enter" ? "leave" : "enter") &&
                            candidateEvent['node'] !== node;
      if (isOppositeEvent) {
        this._parentMap.delete(parent);

        // this will ensure that the events/elements are always handled
        // in leave and then enter order
        var containedAnimations = [entry, candidateEvent].sort((a,b) => {
          return a['event'] == "leave" ? 0 : 1;
        });

        var combinedCallback = () => {
          containedAnimations.forEach((c) => c['callback']());
        };

        var combinedElements = containedAnimations.map((c) => c['node']);
        this._registry.push({
          event: 'swap',
          node: parent,
          callback: combinedCallback,
          data: {
            elements: combinedElements,
            anchors: []
          }
        });
      } else {
        this._parentMap.set(parent, entry);
      }
    } else {
      this._registry.push(entry);
    }
  }

  _isStructuralEvent(eventName) {
    return eventName == "enter" || eventName == "leave" || eventName == "move";
  }

  getItems() {
    var items = this._registry.map((item) => item);
    this._parentMap.forEach((entry) => {
      items.push(entry);
    });
    return items;
  }

}

@Injectable()
export class AnimatorDispatch {
  private _entries = [];
  private _counter = 0;

  constructor(private _zone: NgZone) {}

  queue(node, event, data = {}, callback = null) {
    this._entries.push({
      event: event,
      node: node,
      data: data,
      callback: callback
    });

    if (this._entries.length == 1) {
      this._onTick(() => this.flush());
    }
  }

  flush() {
    var relativeEntries = this._mergeRelativeEvents(this._entries);

    this._counter++;
    this._entries = [];

    for (var i = 0; i < relativeEntries.length; i++) {
      this._triggerEvent(relativeEntries[i], relativeEntries);
    }
  }

  _mergeRelativeEvents(entries) {
    return new AnimatorEventsFilter(entries).getItems();
  }

  _triggerEvent(entry, collectedEvents) {
    var eventData = entry.data || {};
    eventData['callback'] = entry['callback'];
    eventData['collectedEvents'] = collectedEvents;

    var eventName = "ng-" + entry['event'];
    var event = new CustomEvent(eventName, {
      detail: eventData, bubbles: true
    });
    entry['node'].dispatchEvent(event);
  }

  _onTick(callback) {
    var count = ++this._counter;
    this._zone.overrideOnEventDone(() => {
      if (count == this._counter) {
        callback();
      }
    }, true);
  }
}
