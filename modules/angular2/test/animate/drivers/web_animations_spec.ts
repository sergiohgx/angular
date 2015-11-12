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
import {WebAnimationsPlayer, WebAnimationsDriver} from 'angular2/src/animate/ui/drivers/web_animations';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';

function getStyle(element, prop) {
  return DOM.getComputedStyle(element)[prop];
}

export function main() {
  if (!DOM.supportsWebAnimation()) return;

  describe('Web Animations Driver', () => {

    var element;
    beforeEach(() => {
      element = el('<div></div>');
      DOM.appendChild(document.body, element);
    });

    afterEach(() => {
      DOM.remove(element);
    });

    it('should contain a style method which applies the given styles to the given element', () => {
      var driver = new WebAnimationsDriver();
      driver.style(element, { width: '100px' });
      expect(element).toHaveCssStyle({ 'width': '100px' });
    });

    it('should perform a from-to animation and return a player', () => {
      var driver = new WebAnimationsDriver();
      var player: AnimationPlayer = driver.animateFromTo(element,
        { width: '0px' },
        { width: '100px' },
        1000,
        500);

      expect(player.getDuration()).toBe(1000);
      expect(player.getDelay()).toBe(500);
    });

    it('should apply styles onto the element at the given position', () => {
      var driver = new WebAnimationsDriver();
      var player: AnimationPlayer = driver.animateFromTo(element,
        { opacity: '0' },
        { opacity: '1' },
        1000,
        0);

      player.pause();

      player.setPosition(0);
      expect(getStyle(element, 'opacity')).toBe('0');

      player.setPosition(500);
      expect(getStyle(element, 'opacity')).toBe('0.5');

      player.setPosition(1000);
      expect(getStyle(element, 'opacity')).toBe('1');
    });
  });
}
