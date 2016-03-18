import {Injectable} from 'angular2/core';
import {Type, isBlank, isPresent} from 'angular2/src/facade/lang';
import {Map, StringMapWrapper} from 'angular2/src/facade/collection';
import {PromiseWrapper, ObservableWrapper} from 'angular2/src/facade/async';
import {RenderComponentType} from 'angular2/src/core/render/api';
import {NgZone} from 'angular2/src/core/zone/ng_zone';
import {Renderer} from 'angular2/src/core/render/api';
import {CssStylesResolver} from 'angular2/src/animate/worker/css_styles_resolver';

import {AnimationElement} from 'angular2/src/animate/animation_element';
import {AnimationDefinition} from 'angular2/src/animate/worker/animation_definition';
import {AnimationStyles} from 'angular2/src/animate/worker/animation_styles';

export enum AnimationPriority {
  AttributeBased,
  ClassBased,
  Structural
}

export class AnimationRenderQueueEntry {
  constructor(public element: AnimationElement,
              public renderer: Renderer,
              public animation: AnimationDefinition,
              public animationStyles: AnimationStyles,
              public doneFn: Function) {}

  isAnimatable(): boolean { return true; }
}

export class NoOpAnimationRenderQueueEntry extends AnimationRenderQueueEntry {
  constructor(public doneFn: Function) {
    super(null, null, null, null, doneFn);
  }

  isAnimatable(): boolean { return false; }
}

export class AnimationElementLookupEntry {
  constructor(public index: number, public priority: AnimationPriority) {}
}

@Injectable()
export class AnimationRenderQueue {
  queue: AnimationRenderQueueEntry[] = [];
  queueLookup = new Map<Node, AnimationElementLookupEntry>();
  lookup = new Map<RenderComponentType, {[key: string]: any}>();

  constructor(private _zone: NgZone,
              private _stylesResolver: CssStylesResolver) {
    ObservableWrapper.subscribe(this._zone.onMicrotaskEmpty, (e) => {
      this.flush();
    });
  }

  public registerComponent(componentProto: RenderComponentType,
                           animationRenderer: Renderer,
                           animations: {[key: string]: any},
                           animationStyles: {[key: string]: any}): void {
    this.lookup.set(componentProto, {
      'animations': animations,
      'animationStyles': new AnimationStyles(this._stylesResolver, animationStyles),
      'animationRenderer': animationRenderer
    });
  }

  public schedule(priority: AnimationPriority, componentProto: RenderComponentType, element: HTMLElement, eventName: string, event: Event, data: {[key: string]: any} = null, doneFn: Function = null): void {
    data = isPresent(data) ? data : {};
    doneFn = isPresent(doneFn) ? doneFn : function() { };

    var registerAnimation = false;
    var entry = this.lookup.get(componentProto);

    if (isPresent(entry)) {
      let animationDetails = <AnimationDefinition>entry['animations'][eventName];

      if (isPresent(animationDetails)) {
        let existingAnimation = this.queueLookup.get(element);
        if (!isPresent(existingAnimation)) {
          registerAnimation = true;
        } else if (existingAnimation.priority < priority) {
          this.queue[existingAnimation.index] = new NoOpAnimationRenderQueueEntry(doneFn);
          registerAnimation = true;
        }
      }

      if (registerAnimation) {
        this.queueLookup.set(element, new AnimationElementLookupEntry(this.queue.length, priority));

        var contextData = {
          'event': event,
          'eventName': eventName,
          'data': data
        };

        this.queue.push(new AnimationRenderQueueEntry(
          new AnimationElement(element, contextData),
          entry['animationRenderer'],
          animationDetails,
          entry['animationStyles'],
          doneFn
        ));
      }
    }

    if (!registerAnimation) {
      // fallback noOp animation
      this.queue.push(new NoOpAnimationRenderQueueEntry(doneFn));
    }
  }

  public flush(): void {
    if (this.queue.length == 0) return;
    var index = 0;
    this.queue.forEach((entry: AnimationRenderQueueEntry) => {
      if (entry.isAnimatable()) {
        var player = entry.animation.start(entry.element, {}, entry.animationStyles, entry.renderer, index++);
        player.subscribe(() => entry.doneFn());
      } else {
        entry.doneFn();
      }
    });
    this.queue = [];
    this.queueLookup.clear();
  }
}
