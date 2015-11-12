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

import {isPresent} from 'angular2/src/facade/lang';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {Animation} from 'angular2/src/animate/ui/animation';

import {ComponentAnimationDefinition} from 'angular2/src/animate/ui/component_animations_lookup';
import {CssAnimationsDriver} from 'angular2/src/animate/ui/drivers/css_animations';
import {WebAnimationsDriver} from 'angular2/src/animate/ui/drivers/web_animations';

export function main() {
  describe('ComponentAnimationDefinition', () => {
    it('should prepare an animation based off of the long-form definition', () => {
      var config = {
        'on': 'some-event',
        'animation': []
      };

      var def = new ComponentAnimationDefinition('my-animation', config);
      expect(def.name).toBe('my-animation');
      expect(def.on).toBe('some-event');

      var animation: Animation = def.animation;
      expect(isPresent(animation)).toBe(true);
    });

    iit('should assign the {WebAnimationsDriver|CssAnimationsDriver} as the default driver', () => {
      var config = {
        'animation': []
      };

      var def = new ComponentAnimationDefinition('my-animation', config);

      var status = (def.driver instanceof WebAnimationsDriver) ||
                   (def.driver instanceof CssAnimationsDriver);

      expect(status).toBe(true);
    });

    iit('should prepare an animation based off of the short-form definition', () => {
      var config = [];
      var def = new ComponentAnimationDefinition('my-animation', config);
      expect(def.name).toBe('my-animation');
      expect(def.on).toBe('my-animation');

      var animation: Animation = def.animation;
      expect(isPresent(animation)).toBe(true);
    });
  });

  describe('ComponentAnimationsLookup', () => {
  });
}
