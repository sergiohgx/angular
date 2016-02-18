import {PromiseWrapper} from 'angular2/src/facade/async';
import {AnimationElement} from 'angular2/src/animate/ui/animation_element';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {AnimationHelperMap} from 'angular2/src/animate/ui/animation_helper_map';
import {AnimationStyles} from 'angular2/src/animate/ui/animation_styles';
import {NoOpAnimationPlayer} from 'angular2/src/animate/ui/animation_player';

export abstract class Animation {
  abstract start(elements: AnimationElement[],
                 styleLookup: AnimationStyles,
                 driver: AnimationDriver,
                 startIndex: number): AnimationPlayer;
}

export class NoOpAnimation extends Animation {
  start(elements: AnimationElement[],
        styleLookup: AnimationStyles,
        driver: AnimationDriver,
        startIndex: number): AnimationPlayer {
    return new NoOpAnimationPlayer();
  }
}
