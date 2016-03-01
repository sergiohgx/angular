import {PromiseWrapper} from 'angular2/src/facade/async';
import {SequenceAnimation} from 'angular2/src/animate/ui/sequence_animation';
import {GroupAnimation} from 'angular2/src/animate/ui/group_animation';
import {isStringMap, isArray, isPresent} from 'angular2/src/facade/lang';
import {Animation} from 'angular2/src/animate/ui/animation';
import {StepAnimation} from 'angular2/src/animate/ui/step_animation';
import {AnimationElement} from 'angular2/src/animate/ui/animation_element';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {AnimationHelperMap} from 'angular2/src/animate/ui/animation_helper_map';
import {AnimationStyles} from 'angular2/src/animate/ui/animation_styles';
import {Set, StringMapWrapper} from 'angular2/src/facade/collection';

export class AnimationOperation extends Animation {
  private _animator: Animation;
  private _restoreProperties: Set<string> = new Set<string>();
  private _restoreClasses: Set<string> = new Set<string>();

  constructor(steps: any, helpers: AnimationHelperMap) {
    super();
    this._collectStateStyles(steps);
    steps = this._collectStateStyles(steps);
    this._animator = AnimationOperation.normalizeStep(helpers, steps);
  }

  _collectStateStyles(steps: any[]): any[] {
    var restoreAll = false;
    var createRestorePoint = false;

    for (var i = steps.length - 1; i >= 0; i--) {
      let entry = steps[i];
      if (entry['css'].indexOf(':initial') >= 0) {
        createRestorePoint = true;
        restoreAll = true;
        break;
      }
    }

    steps.forEach((step) => {
      step['css'].forEach((token: any) => {
        if (isStringMap(token)) {
          StringMapWrapper.forEach(token, (style, prop) => {
            if (style === true || restoreAll) {
              createRestorePoint = true;
              this._restoreProperties.add(prop);
            }
          });
        } else if (token[0] == '.' && restoreAll) {
          this._restoreClasses.add(<string>token);
        }
      });
    });

    var newSteps = [];
    if (createRestorePoint) {
      var firstStep = steps[0];
      if (!isPresent(firstStep['snapshot'])) {
        firstStep['snapshot'] = ':initial';
        firstStep['snapshotStyles'] = [];
        if (!isPresent(firstStep['css'])) {
          firstStep['css'] = [];
        }
      } else {
        newSteps.push({
          'css': [],
          'snapshot': ':initial',
          'snapshotStyles': []
        });
      }
    }

    steps.forEach((step) => {
      newSteps.push(step);
    });

    return newSteps;
  }

  start(elements: AnimationElement[],
        styleLookup: AnimationStyles,
        initialStyles: {[key: string]: any},
        driver: AnimationDriver,
        startIndex: number): AnimationPlayer {

    initialStyles = isPresent(initialStyles) ? initialStyles : {};
    if (this._restoreProperties.size > 0 || this._restoreClasses.size > 0) {
      var restoreStyles = new Set<string>();
      this._restoreProperties.forEach((style) => {
        restoreStyles.add(style);
      });

      var classes = [];
      this._restoreClasses.forEach((klass) => classes.push(klass));

      styleLookup.lookupAndResolve(classes).getProperties().forEach((prop) => {
        restoreStyles.add(prop);
      });

      restoreStyles.forEach((prop) => {
        initialStyles[prop] = true;
      });
    }

    return this._animator.start(elements, styleLookup, initialStyles, driver, startIndex);
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
