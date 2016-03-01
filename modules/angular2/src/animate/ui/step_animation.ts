import {PromiseWrapper} from 'angular2/src/facade/async';
import {isPresent, isString} from 'angular2/src/facade/lang';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';

import {Animation} from 'angular2/src/animate/ui/animation';
import {AnimationPlayer, NoOpAnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {AnimationElement} from 'angular2/src/animate/ui/animation_element';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {AnimationHelperMap} from 'angular2/src/animate/ui/animation_helper_map';
import {AnimationStyles} from 'angular2/src/animate/ui/animation_styles';
import {AnimationHelper} from 'angular2/src/animate/ui/animation_helper';
import {GroupAnimation, GroupAnimationPlayer} from 'angular2/src/animate/ui/group_animation';

export class StepAnimation extends Animation {
  private _query: string;
  private _css: any[];
  private _snapshot: string;
  private _snapshotStyles: string[];
  private _duration: number;
  private _delay: number;
  private _easing: string;
  private _transforms: string[];
  private _staggerName: string;
  private _staggerDelay: number;

  constructor(private _helpers: AnimationHelperMap, {query, css, snapshot, snapshotStyles, duration, delay, easing, transforms, staggerName, staggerDelay}: {
    query: string,
    css: string[],
    snapshot: string,
    snapshotStyles: string[],
    duration: number,
    delay: number,
    easing: string,
    transforms: string[],
    staggerName: string,
    staggerDelay: number
  }) {
    super();
    this._query = query;
    this._css = css;
    this._snapshot = snapshot;
    this._snapshotStyles = snapshotStyles;
    this._duration = duration;
    this._delay = delay;
    this._easing = easing;
    this._transforms = transforms;
    this._staggerName = staggerName;
    this._staggerDelay = staggerDelay;
  }

  start(elements: AnimationElement[],
        styleLookup: AnimationStyles,
        driver: AnimationDriver,
        startIndex: number): AnimationPlayer {

    const CONTEXT_STORAGE_KEY = '_lastAnimatedStyles';

    var players = [];
    var staggerDelay = this._staggerDelay;

    elements.forEach((elm: AnimationElement, stepIndex: number) => {
      var element = elm.element;
      var context = elm.context;
      var duration = this._duration;
      var delay = this._delay;
      var easing = this._easing;

      var startStyles = context[CONTEXT_STORAGE_KEY];

      if (isPresent(this._snapshot)) {
        if (this._snapshotStyles.length) {
          startStyles = isPresent(startStyles) ? startStyles : {};
          var gcs = DOM.getComputedStyle(element);
          this._snapshotStyles.forEach((prop) => {
            startStyles[prop] = gcs[prop];
          });
        }
        this._helpers.registerSnapshot(element, this._snapshot, startStyles);
        players.push(new NoOpAnimationPlayer());
        return;
      }

      var formattedCss = this._css.map((entry) => {
        if (isString(entry) && entry[0] == ':') {
          entry = this._helpers.lookupSnapshot(element, entry);
        }
        return entry;
      });

      var endStyles = styleLookup.lookupAndResolve(formattedCss).getStyles();
      if (isPresent(startStyles)) {
        endStyles = StringMapWrapper.merge(startStyles, endStyles);
      }
      context[CONTEXT_STORAGE_KEY] = endStyles;

      if (duration == 0) {
        startStyles = endStyles;
        staggerDelay = 0;
      }

      var children = isPresent(this._query)
        ? DOM.querySelectorAll(element, this._query)
        : [element];

      var baseIndex = stepIndex + startIndex;
      children.map((child, childIndex: number) => {
        for (var i = 0; i < this._transforms.length; i++) {
          let step = this._transforms[i];
          let helper = <AnimationHelper>this._helpers.lookup(step);
          let fnStyles = helper.pipe(child, endStyles, context);
          if (fnStyles instanceof Promise) {
            // TODO: use player
            return fnStyles;
          }
          endStyles = fnStyles;
        }

        duration = isPresent(endStyles['duration']) ? endStyles['duration'] : duration;
        delay    = isPresent(endStyles['delay'])    ? endStyles['delay']    : delay;
        easing   = isPresent(endStyles['easing'])   ? endStyles['easing']   : easing;

        var childIndex = baseIndex + childIndex;
        delay = delay + childIndex * staggerDelay;

        var player = driver.animateFromTo(child, startStyles, endStyles, duration, delay, easing, false);
        players.push(player);
      });
    });

    return new GroupAnimationPlayer(players);
  }
}
