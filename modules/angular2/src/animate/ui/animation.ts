import {Promise, PromiseWrapper} from 'angular2/src/facade/async';
import {AnimationElement} from 'angular2/src/animate/ui/animation_element';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {AnimationHelperMap} from 'angular2/src/animate/ui/animation_helper_map';
import {CssSelectorStylesMap} from 'angular2/src/animate/ui/css_selector_styles_map';
import {NoOpAnimationPlayer} from 'angular2/src/animate/ui/animation_player';

export interface Animation {
  start(elements: AnimationElement[],
        styleLookup: CssSelectorStylesMap,
        helpers: AnimationHelperMap,
        driver: AnimationDriver): AnimationPlayer;
}

export class NoOpAnimation implements Animation {
  start(elements: AnimationElement[],
        styleLookup: CssSelectorStylesMap,
        helpers: AnimationHelperMap,
        driver: AnimationDriver): AnimationPlayer {
    return new NoOpAnimationPlayer();
  }
}
