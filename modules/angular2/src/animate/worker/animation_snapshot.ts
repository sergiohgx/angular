import {Renderer} from 'angular2/src/core/render/api';
import {Set, StringMapWrapper} from 'angular2/src/facade/collection';

import {AnimationElement} from 'angular2/src/animate/animation_element';
import {AnimationStyles} from 'angular2/src/animate/worker/animation_styles';
import {AnimationGroupPlayer} from 'angular2/src/animate/worker/animation_group';
import {NoOpAnimationPlayer, AnimationPlayer} from 'angular2/src/animate/animation_player';
import {AnimationDefinition} from 'angular2/src/animate/worker/animation_definition';
import {AnimationToken} from 'angular2/src/animate/worker/animation_step';

export class AnimationSnapshot extends AnimationDefinition {
  constructor(private _snapshotName: string, private _extraProperties: string[]) {
    super();
  }

  start(element: AnimationElement, context: any, styleLookup: AnimationStyles, renderer: Renderer, stringIndex: number): AnimationPlayer {

    var properties = [];
    var collectedProperties = context['properties'];

    collectedProperties.forEach((prop) => {
      properties.push(prop);
    });

    this._extraProperties.forEach((prop) => {
      properties.push(prop);
    });

    renderer['createSnapshot'](this._snapshotName, properties);
    return new NoOpAnimationPlayer();
  }

  stagger(timing: string): AnimationDefinition {
    return this;
  }

  getTokens(): Set<AnimationToken> {
    return null;
  }
}
