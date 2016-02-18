import {PromiseWrapper} from 'angular2/src/facade/async';
import {SequenceAnimation} from 'angular2/src/animate/ui/sequence_animation';
import {GroupAnimation} from 'angular2/src/animate/ui/group_animation';
import {isArray, isPresent} from 'angular2/src/facade/lang';
import {Animation} from 'angular2/src/animate/ui/animation';
import {StepAnimation} from 'angular2/src/animate/ui/step_animation';
import {AnimationElement} from 'angular2/src/animate/ui/animation_element';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {AnimationHelperMap} from 'angular2/src/animate/ui/animation_helper_map';
import {AnimationStyles} from 'angular2/src/animate/ui/animation_styles';

export class AnimationOperation extends Animation {
  private _animator: Animation;

  constructor(steps: any, helpers: AnimationHelperMap) {
    super();
    this._animator = AnimationOperation.normalizeStep(helpers, steps);
  }

  start(elements: AnimationElement[],
        styleLookup: AnimationStyles,
        driver: AnimationDriver,
        startIndex: number): AnimationPlayer {
    return this._animator.start(elements, styleLookup, driver, startIndex);
  }

  static normalizeStep(helpers, entryItem): Animation {
    if (entryItem instanceof Animation) return entryItem;

    var type, entries;
    if (isPresent(entryItem) && isPresent(entryItem['css'])) {
      return new StepAnimation(helpers, entryItem);
    } else if (isArray(entryItem)) {
      type = 'sequence';
      entries = entryItem;
    } else {
      type = entryItem['type'];
      entries = entryItem['entries'];
    }

    switch (type) {
      case 'sequence':
        return new SequenceAnimation(
          entries.map((entry) => AnimationOperation.normalizeStep(helpers, entry))
        );

      case 'group':
        return new GroupAnimation(
          entries.map((entry) => AnimationOperation.normalizeStep(helpers, entry))
        );

      default:
        return null;
    }
  }
}
