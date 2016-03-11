import {Injectable} from 'angular2/core';
import {isBlank, isPresent} from 'angular2/src/facade/lang';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {PromiseWrapper, ObservableWrapper} from 'angular2/src/facade/async';
import {RenderComponentType} from 'angular2/src/core/render/api';
import {NgZone} from 'angular2/src/core/zone/ng_zone';

import {Animation} from 'angular2/src/animate/ui/animation';
import {AnimationElement} from 'angular2/src/animate/ui/animation_element';
import {AnimationHelperMap} from 'angular2/src/animate/ui/animation_helper_map';
import {AnimationOperation} from 'angular2/src/animate/ui/animation_operation';
import {AnimationStyles} from 'angular2/src/animate/ui/animation_styles';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {WebAnimationsDriver} from 'angular2/src/animate/ui/drivers/web_animations';
import {CssAnimationsDriver} from 'angular2/src/animate/ui/drivers/css';
import {CssMediaQueryResolver} from 'angular2/src/animate/ui/css_media_query_resolver';

function _resolveAnimationDriver(candidateDriverName: string, defaultDriver: AnimationDriver) {
  var driver = defaultDriver;
  if (!isBlank(candidateDriverName)) {
    // TODO(matsko): resolve which driver
  }
  return driver;
}

export enum AnimationPriority {
  AttributeBased,
  ClassBased,
  Structural
}

class _AnimationRenderQueueEntry {
  constructor(public element: AnimationElement,
              public driver: AnimationDriver,
              public animation: AnimationOperation,
              public animationStyles: AnimationStyles,
              public doneFn: Function) {}

  isAnimatable(): boolean { return true; }
}

class _NoOpAnimationRenderQueueEntry extends _AnimationRenderQueueEntry {
  constructor(public doneFn: Function) {
    super(null, null, null, null, doneFn);
  }

  isAnimatable(): boolean { return false; }
}

class _AnimationElementLookupEntry {
  constructor(public index: number, public priority: AnimationPriority) {}
}

@Injectable()
export class AnimationRenderQueue {
  queue: _AnimationRenderQueueEntry[] = [];
  queueLookup = new Map<Node, _AnimationElementLookupEntry>();
  lookup = new Map<RenderComponentType, {[key: string]: any}>();
  _defaultDriver: AnimationDriver;

  constructor(private _zone: NgZone,
              private _helpers: AnimationHelperMap,
              private _mediaQueryResolver: CssMediaQueryResolver) {
    ObservableWrapper.subscribe(this._zone.onTurnDone, (e) => {
      this.flush();
    });

    this._defaultDriver = new WebAnimationsDriver();
  }

  public registerComponent(componentProto: RenderComponentType,
                           animations: {[key: string]: any},
                           animationStyles: {[key: string]: any}): void {
    var compiledAnimations = {};
    StringMapWrapper.forEach(animations, (animationSteps, event) => {
      compiledAnimations[event] = new AnimationOperation(animationSteps, this._helpers);
    });

    var candidateDriver = ''; // componentProto['animationDriver'];
    var animationDriver = _resolveAnimationDriver(candidateDriver, this._defaultDriver);

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

    if (isPresent(entry)) {
      let animationDetails = <AnimationOperation>entry['animations'][eventName];

      if (isPresent(animationDetails)) {
        let existingAnimation: _AnimationElementLookupEntry = this.queueLookup.get(element);
        if (!isPresent(existingAnimation)) {
          registerAnimation = true;
        } else if (existingAnimation.priority < priority) {
          this.queue[existingAnimation.index] = new _NoOpAnimationRenderQueueEntry(doneFn);
          registerAnimation = true;
        }
      }

      if (registerAnimation) {
        this.queueLookup.set(element, new _AnimationElementLookupEntry(this.queue.length, priority));

        this.queue.push(new _AnimationRenderQueueEntry(
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
      this.queue.push(new _NoOpAnimationRenderQueueEntry(doneFn));
    }
  }

  public flush(): void {
    if (this.queue.length == 0) return;
    var index = 0;
    this.queue.forEach((entry: _AnimationRenderQueueEntry) => {
      if (entry.isAnimatable()) {
        var player = entry.animation.start([entry.element], entry.animationStyles, entry.driver, index++);
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
