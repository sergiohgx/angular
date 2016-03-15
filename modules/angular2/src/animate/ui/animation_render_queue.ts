import {Injectable} from 'angular2/core';
import {Type, isBlank, isPresent} from 'angular2/src/facade/lang';
import {Map, StringMapWrapper} from 'angular2/src/facade/collection';
import {PromiseWrapper, ObservableWrapper} from 'angular2/src/facade/async';
import {RenderComponentType} from 'angular2/src/core/render/api';
import {NgZone} from 'angular2/src/core/zone/ng_zone';

import {Animation} from 'angular2/src/animate/ui/animation';
import {AnimationElement} from 'angular2/src/animate/ui/animation_element';
import {AnimationHelperMap} from 'angular2/src/animate/ui/animation_helper_map';
import {AnimationOperation} from 'angular2/src/animate/ui/animation_operation';
import {AnimationStyles} from 'angular2/src/animate/ui/animation_styles';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {CssMediaQueryResolver} from 'angular2/src/animate/ui/css_media_query_resolver';

export enum AnimationPriority {
  AttributeBased,
  ClassBased,
  Structural
}

export class AnimationRenderQueueEntry {
  constructor(public element: AnimationElement,
              public driver: AnimationDriver,
              public animation: AnimationOperation,
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
              private _helpers: AnimationHelperMap,
              private _mediaQueryResolver: CssMediaQueryResolver,
              private _defaultDriver: AnimationDriver) {
    ObservableWrapper.subscribe(this._zone.onTurnDone, (e) => {
      this.flush();
    });
  }

  public registerComponent(componentProto: RenderComponentType,
                           animations: {[key: string]: any},
                           animationStyles: {[key: string]: any}): void {
    var compiledAnimations = {};
    StringMapWrapper.forEach(animations, (animationSteps, event) => {
      compiledAnimations[event] = new AnimationOperation(animationSteps, this._helpers);
    });

    // TODO (matsko): allow specific drivers
    // var candidateDriver = ''; // componentProto['animationDriver'];
    var animationDriver = this._defaultDriver;

    this.lookup.set(componentProto, {
      'animations': compiledAnimations,
      'animationStyles': new AnimationStyles(this._mediaQueryResolver, animationStyles),
      'animationDriver': animationDriver
    });
  }

  public schedule(priority: AnimationPriority, componentProto: RenderComponentType, element: HTMLElement, eventName: string, event: Event, data: {[key: string]: any} = null, doneFn: Function = null): void {
    data = isPresent(data) ? data : {};
    doneFn = isPresent(doneFn) ? doneFn : function() { };

    var registerAnimation = false;
    var entry = this.lookup.get(componentProto);
    console.log('schedule', eventName);

    if (isPresent(entry)) {
      let animationDetails = <AnimationOperation>entry['animations'][eventName];

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

        this.queue.push(new AnimationRenderQueueEntry(
          new AnimationElement(element, eventName, event, data),
          entry['animationDriver'],
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
    console.log('flush');
    if (this.queue.length == 0) return;
    var index = 0;
    this.queue.forEach((entry: AnimationRenderQueueEntry) => {
      if (entry.isAnimatable()) {
        var player = entry.animation.start([entry.element], entry.animationStyles, {}, entry.driver, index++);
        entry.element.player = player;
        player.subscribe(() => entry.doneFn());
      } else {
        entry.doneFn();
      }
    });
    this.queue = [];
    this.queueLookup.clear();
  }
}
