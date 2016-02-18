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

function resolveAnimationDriver(candidateDriverName: string, defaultDriver: AnimationDriver) {
  var driver = defaultDriver;
  if (!isBlank(candidateDriverName)) {
    // TODO(matsko): resolve which driver
  }
  return driver;
}

class AnimationRenderQueueEntry {
  constructor(public element: AnimationElement,
              public driver: AnimationDriver,
              public animation: AnimationOperation,
              public animationStyles: AnimationStyles,
              public doneFn: Function) {}
}

@Injectable()
export class AnimationRenderQueue {
  queue = [];
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
    var animationDriver = resolveAnimationDriver(candidateDriver, this._defaultDriver);

    this.lookup.set(componentProto, {
      'animations': compiledAnimations,
      'animationStyles': new AnimationStyles(this._mediaQueryResolver, animationStyles),
      'animationDriver': animationDriver
    });
  }

  public schedule(componentProto: RenderComponentType, element: HTMLElement, eventName: string, event: Event): Promise<any> {
    var defer = PromiseWrapper.completer();
    var resolve = defer['resolve'];
    var animationDetected = false;

    var entry = this.lookup.get(componentProto);
    if (isPresent(entry)) {
      let animationDetails = <AnimationOperation>entry['animations'][eventName];
      if (isPresent(animationDetails)) {
        this.queue.push(new AnimationRenderQueueEntry(
          new AnimationElement(element, eventName, event),
          entry['animationDriver'],
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

  public flush(): void {
    if (this.queue.length == 0) return;
    this.queue.forEach((entry: AnimationRenderQueueEntry, index: number) => {
      var player = entry.animation.start([entry.element], entry.animationStyles, entry.driver, index);
      entry.element.player = player;
      player.subscribe(() => {
        entry.doneFn();
      });
    });
    this.queue = [];
  }
}
