import {Promise, PromiseWrapper} from 'angular2/src/facade/async';
import {isPresent, isPromiseLike} from 'angular2/src/facade/lang';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';

import {Animation} from 'angular2/src/animate/ui/animation';
import {AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {AnimationElement} from 'angular2/src/animate/ui/animation_element';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {AnimationHelperMap} from 'angular2/src/animate/ui/animation_helper_map';
import {CssSelectorStylesMap} from 'angular2/src/animate/ui/css_selector_styles_map';
import {GroupedAnimationPlayer} from 'angular2/src/animate/ui/grouped_animation';

export class ElementBasedAnimation implements Animation {
  private _css: string;
  private _query: string;
  private _steps: string[];
  private _staggerName: string;
  private _staggerDelay: string;

  constructor({query, css, steps, staggerName, staggerDelay}: {
      query: string,
      css: string,
      steps: string[],
      staggerName: string,
      staggerDelay: string|number
    }) {

    this._query = query;
    this._css = css;
    this._steps = steps;
    this._staggerName = staggerName;
    this._staggerDelay = staggerDelay.toString();
  }

  start(elements: AnimationElement[],
        styleLookup: CssSelectorStylesMap,
        helpers: AnimationHelperMap,
        driver: AnimationDriver): AnimationPlayer {

    var players = [];
    elements.forEach((elm: AnimationElement) => {
      var element = elm.element;
      var context = elm.context;

      var startStyles: {[key: string]: string} = {};
      var endStyles = styleLookup.lookupAndResolve(this._css);

      var duration = endStyles['duration'];
      var delay = endStyles['delay'];

      var children = isPresent(this._query)
          ? DOM.querySelectorAll(element, this._query)
          : [element];

      children.map((child) => {
        for (var i = 0; i < this._steps.length; i++) {
          let step = this._steps[i];
          let fn = helpers.lookup(step);
          let fnStyles = fn(child, endStyles, context);
          if (isPromiseLike(fnStyles)) {
            // TODO: use player
            return fnStyles;
          }
          endStyles = fnStyles;
        }

        duration = isPresent(endStyles['duration']) ? endStyles['duration'] : duration;
        delay    = isPresent(endStyles['delay'])    ? endStyles['delay']    : delay;

        //delete endStyles['duration'];
        //delete endStyles['delay'];

        var player = driver.animateFromTo(child, startStyles, endStyles, duration, delay);
        players.push(player);
      });
    });

    return new GroupedAnimationPlayer(players);
  }
}
