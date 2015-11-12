import {Promise, PromiseWrapper} from 'angular2/src/facade/async';
import {SequencedAnimation} from 'angular2/src/animate/ui/sequenced_animation';
import {GroupedAnimation} from 'angular2/src/animate/ui/grouped_animation';
import {isArray} from 'angular2/src/facade/lang';
import {Animation} from 'angular2/src/animate/ui/animation';
import {ElementBasedAnimation} from 'angular2/src/animate/ui/element_based_animation';
import {AnimationElement} from 'angular2/src/animate/ui/animation_element';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {AnimationHelperMap} from 'angular2/src/animate/ui/animation_helper_map';
import {CssSelectorStylesMap} from 'angular2/src/animate/ui/css_selector_styles_map';

export class AnimationOperation implements Animation {
  private _animator: Animation;

  constructor(steps: any) {
    this._animator = AnimationOperation.normalizeStep(steps);
  }

  start(elements: AnimationElement[],
        styleLookup: CssSelectorStylesMap,
        helpers: AnimationHelperMap,
        driver: AnimationDriver): AnimationPlayer {
    return this._animator.start(elements, styleLookup, helpers, driver);
  }

  static normalizeStep(entryItem): Animation {
    if (entryItem instanceof Animation) return entryItem;

    var type, entries;
    if (isArray(entryItem)) {
      type = 'sequence';
      entries = entryItem;
    } else {
      type = entryItem['type'];
      entries = entryItem['entries'];
    }

    switch (type) {
      case 'sequence':
        return new SequencedAnimation(
          entries.map((entry) => AnimationOperation.normalizeStep(entry))
        );
        break;

      case 'group':
        return new GroupedAnimation(
          entries.map((entry) => AnimationOperation.normalizeStep(entry))
        );
        break;

      default:
        if (isArray(entries)) {
          return new ElementBasedAnimation(entries);
        }
        return null;
        break;
    }
  }
}
