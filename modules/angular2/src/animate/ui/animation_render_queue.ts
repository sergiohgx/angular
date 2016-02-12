import {Injectable} from 'angular2/core';
import {isPresent} from 'angular2/src/facade/lang';
import {PromiseWrapper, ObservableWrapper} from 'angular2/src/facade/async';
import {RenderComponentType} from 'angular2/src/core/render/api';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';
import {triggerAnimation} from 'angular2/src/animate/ui/animation';
import {AnimationElement} from 'angular2/src/animate/ui/animation_element';
import {NgZone} from 'angular2/src/core/zone/ng_zone';

class AnimationRenderQueueEntry {
  constructor(public element: AnimationElement, public animation: any[], public animationStyles: any, public doneFn: Function) {}
}

@Injectable()
export class AnimationRenderQueue {
  queue = [];
  lookup = new Map<RenderComponentType, {[key: string]: any}>();

  constructor(private _zone: NgZone) {
    ObservableWrapper.subscribe(this._zone.onTurnDone, (e) => {
      this.flush();
    });
  }

  public registerComponent(componentProto: RenderComponentType, animations: {[key: string]: any}, animationStyles: {[key: string]: any}) {
    this.lookup.set(componentProto, {
      'animations': animations,
      'animationStyles': animationStyles
    });
  }

  public schedule(componentProto: RenderComponentType, element: HTMLElement, eventName: string, event: Event): Promise<any> {
    var defer = PromiseWrapper.completer();
    var resolve = defer['resolve'];
    var animationDetected = false;

    var entry = this.lookup.get(componentProto);
    if (isPresent(entry)) {
      let animationDetails = entry['animations'][eventName];
      if (isPresent(animationDetails)) {
        this.queue.push(new AnimationRenderQueueEntry(
          new AnimationElement(element, eventName, event),
          animationDetails,
          entry['animationStyles'],
          () => resolve()
        ));
        animationDetected = true;
      }
    }

    if (!animationDetected) {
      resolve();
    }
    return defer['promise'];
  }

  public flush() {
    if (this.queue.length == 0) return;
    this.queue.forEach((entry: AnimationRenderQueueEntry) => {
      triggerAnimation(entry.element, entry.animation, entry.animationStyles).then(() => entry.doneFn());
    });
    this.queue = [];
  }
}
