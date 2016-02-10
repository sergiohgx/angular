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
import {AnimationDefinition, css, query, fn} from 'angular2/src/animate/worker/animation_definition';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';

function getStyle(element, prop) {
  return DOM.getComputedStyle(element)[prop];
}

export function main() {
  describe('AnimationDefinition', () => {
    it('should throw an error if no animation CSS code or steps are registered', () => {
      var def = new AnimationDefinition();
      expect(() => {
        var steps = def.steps;
      }).toThrow();
    });

    describe('css', () => {
      it('should export the provided step value', () => {
        var def = css('.something 1s');
        expect(def.steps['css']).toEqual([['.something', 1000]]);
      });

      it('should throw an exception when a css value is defined twice', () => {
        var def = new AnimationDefinition();
        def.css('.one 1s');
        expect(() => {
          def.css('.two 1s');
        }).toThrow();
      });
    });

    describe('fn', () => {
      it('should explose the fn as an inner step', () => {
        var def = fn('explode');
        expect(def.steps['steps']).toEqual([['explode']]);

        def.pipe('implode');
        expect(def.steps['steps']).toEqual([['explode'], ['implode']]);
      });

      it('should combine both the `css` and `fn` helper methods into one', () => {
        var def = css('.one 2s').pipe('two', 'some value');
        expect(def.steps['css']).toEqual([['.one', 2000]]);
        expect(def.steps['steps'][0]).toEqual(['two', 'some value']);
      });
    });

    describe('query', () => {
      it('should throw an error if a query is provided but no animations', () => {
        var def = query('.something');
        expect(() => {
          var steps = def.steps;
        }).toThrow();
      });

      it('should explose the query in the step details', () => {
        var def = query('.something').css('.my-animation 100ms');
        var steps = def.steps;
        expect(steps['query']).toEqual('.something');
        expect(steps['css']).toEqual([['.my-animation',100]]);
      });
    });

    describe('AnimationDefinition', () => {
      it('should create a CSS animation with a stagger', () => {
        var def = new AnimationDefinition();
        def.css('.my-animation');
        def.stagger('reverse', '100ms');
        expect(def.steps['staggerName']).toEqual('reverse');
        expect(def.steps['staggerDelay']).toEqual(100);
      });

      it('should use `linear` as the default stagger name when only the duration is provided', () => {
        var def = new AnimationDefinition();
        def.css('.my-animation');
        def.stagger('999ms');
        expect(def.steps['staggerName']).toEqual('linear');
        expect(def.steps['staggerDelay']).toEqual(999);
      });
    });
  });
}
