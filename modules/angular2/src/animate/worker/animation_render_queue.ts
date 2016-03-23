import {Injectable} from 'angular2/core';
import {Type, isBlank, isPresent, isArray} from 'angular2/src/facade/lang';
import {Map, StringMapWrapper} from 'angular2/src/facade/collection';
import {PromiseWrapper, ObservableWrapper} from 'angular2/src/facade/async';
import {RenderComponentType} from 'angular2/src/core/render/api';
import {NgZone} from 'angular2/src/core/zone/ng_zone';
import {Renderer} from 'angular2/src/core/render/api';
import {CssStylesResolver} from 'angular2/src/animate/worker/css_styles_resolver';

import {AnimationStyles} from 'angular2/src/animate/worker/animation_styles';
import {AnimationPlayer, NoOpAnimationPlayer} from 'angular2/src/animate/animation_player';
import {AnimationFactory, AnimationCompiler} from 'angular2/src/compiler/animation_compiler';
import {AnimationMetadata, AnimationStepsMetadata, AnimationSequenceMetadata} from 'angular2/src/core/metadata/animate';

export enum AnimationPriority {
  AttributeBased,
  ClassBased,
  Structural
}

export class AnimationRenderQueueEntry {
  constructor(private _element: Node,
              private _renderer: Renderer,
              private _animation: AnimationFactory,
              public doneFn: Function) {}

  start(index: number): AnimationPlayer {
    var player = this._animation.start(this._element, this._renderer, index);
    player.subscribe(() => this.doneFn());
    return player;
  }
}

export class NoOpAnimationRenderQueueEntry extends AnimationRenderQueueEntry {
  constructor(public doneFn: Function) {
    super(null, null, null, doneFn);
  }

  start(index: number): AnimationPlayer {
    this.doneFn();
    return new NoOpAnimationPlayer();
  }
}

export class AnimationElementLookupEntry {
  constructor(public index: number, public priority: AnimationPriority) {}
}

@Injectable()
export class AnimationRenderQueue {
  queue: AnimationRenderQueueEntry[] = [];
  activeAnimations: AnimationPlayer[] = [];

  queueLookup = new Map<Node, AnimationElementLookupEntry>();
  lookup = new Map<RenderComponentType, {[key: string]: any}>();

  private _compiler = new AnimationCompiler();
  private _stylesResolver = new CssStylesResolver();

  constructor(private _zone: NgZone) {
    ObservableWrapper.subscribe(this._zone.onMicrotaskEmpty, (e) => {
      this.flush();
    });
  }

  public registerComponent(componentProto: RenderComponentType,
                           animationRenderer: Renderer,
                           animations: {[key: string]: AnimationMetadata},
                           animationStyles: {[key: string]: any}): void {

    var compiledStyles = new AnimationStyles(this._stylesResolver, animationStyles);
    var compiledAnimations = {};

    StringMapWrapper.forEach(animations, (data, name) => {
      var entry = animations[name];
      var animation: AnimationStepsMetadata;

      if (entry instanceof AnimationStepsMetadata) {
        animation = <AnimationStepsMetadata>entry;
      } else {
        var entries: AnimationMetadata[] = isArray(entry) ? <AnimationMetadata[]>entry : [entry];
        animation = new AnimationSequenceMetadata(entries);
      }

      compiledAnimations[name] = this._compiler.compileAnimation(animation, compiledStyles);
    });

    this.lookup.set(componentProto, {
      'animations': compiledAnimations,
      'renderer': animationRenderer
    });
  }

  public schedule(priority: AnimationPriority, componentProto: RenderComponentType, element: HTMLElement, eventName: string, event: Event, data: {[key: string]: any} = null, doneFn: Function = null): void {
    data = isPresent(data) ? data : {};
    doneFn = isPresent(doneFn) ? doneFn : function() { };

    var registerAnimation = false;
    var entry = this.lookup.get(componentProto);

    if (isPresent(entry)) {
      let animationDetails = <AnimationFactory>entry['animations'][eventName];

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
          element,
          entry['renderer'],
          animationDetails,
          doneFn
        ));
      }
    }

    // fallback "fake" animation
    if (!registerAnimation) {
      this.queue.push(new NoOpAnimationRenderQueueEntry(doneFn));
    }
  }

  public flush(): void {
    if (this.queue.length == 0) return;

    var index = 0;
    this.queue.forEach((entry: AnimationRenderQueueEntry) => {
      var player = entry.start(index++);

      this.activeAnimations.push(player);

      player.subscribe(() => {
        var index = this.activeAnimations.indexOf(player);
        // TODO (matsko): clean up this player when the animation is done
      });
    });

    this.queue = [];
    this.queueLookup.clear();
  }
}
