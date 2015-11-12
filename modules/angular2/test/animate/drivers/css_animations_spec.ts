import {
  AsyncTestCompleter,
  beforeEach,
  ddescribe,
  describe,
  el,
  expect,
  it,
  inject,
  iit,
  xit,
  TestComponentBuilder
} from 'angular2/testing_internal';

import {StringMapWrapper} from 'angular2/src/facade/collection';
import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {CssAnimationsPlayer, CssAnimationsDriver} from 'angular2/src/animate/ui/drivers/css_animations';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';

function getStyle(element, prop) {
  return DOM.getComputedStyle(element)[prop];
}

export function main() {
  if (!DOM.supportsWebAnimation()) return;

  describe('CSS Animations Driver', () => {

    var element;
    beforeEach(() => {
      element = el('<div></div>');
      DOM.appendChild(document.body, element);
    });

    afterEach(() => {
      DOM.remove(element);
    });

    it('should contain a style method which applies the given styles to the given element', () => {
      var driver = new CssAnimationsDriver();
      driver.style(element, { width: '100px' });
      expect(element).toHaveCssStyle({ 'width': '100px' });
    });

    it('should perform a from-to animation and return a player', () => {
      var driver = new CssAnimationsDriver();
      var player: AnimationPlayer = driver.animateFromTo(element,
        { width: '0px' },
        { width: '100px' },
        1000,
        500);

      expect(player.getDuration()).toBe(1000);
      expect(player.getDelay()).toBe(500);
    });

    it('should retain the animation styles at the start and end of the animation', () => {
      var driver = new CssAnimationsDriver();
      var player: AnimationPlayer = driver.animateFromTo(element,
        { opacity: '0' },
        { opacity: '1' },
        1000,
        0);

      expect(getStyle(element, 'opacity')).toBe('0');

      player.end();

      expect(getStyle(element, 'opacity')).toBe('1');
    });

    it('should remove the transition style once the animation has completed', () => {
      var driver = new CssAnimationsDriver();
      var player: AnimationPlayer = driver.animateFromTo(element,
        { opacity: '0' },
        { opacity: '1' },
        1000,
        0);

      expect(element).toHaveCssStyle('transition');

      player.end();

      expect(element).not.toHaveCssStyle('transition');
    });

    it('should restore any pre-existing CSS transition style once the animation is complete', () => {

      DOM.setStyle(element, 'transition', '100ms linear color');

      expect(element).toHaveCssStyle({ 'transition-duration': '100ms' });
      expect(element).toHaveCssStyle({ 'transition-property': 'color' });

      var driver = new CssAnimationsDriver();
      var player: AnimationPlayer = driver.animateFromTo(element,
        { opacity: '0' },
        { opacity: '1' },
        2000,
        0);

      expect(element).toHaveCssStyle({ 'transition-duration': '2000ms' });
      expect(element).toHaveCssStyle({ 'transition-property': 'all' });

      player.end();

      expect(element).toHaveCssStyle({ 'transition-duration': '100ms' });
      expect(element).toHaveCssStyle({ 'transition-property': 'color' });
    });
  });
}
