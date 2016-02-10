import {
  AsyncTestCompleter,
  beforeEach,
  ddescribe,
  xdescribe,
  describe,
  el,
  dispatchEvent,
  expect,
  iit,
  inject,
  beforeEachProviders,
  it,
  xit,
  containsRegexp,
  stringifyElement,
  TestComponentBuilder,
  fakeAsync,
  clearPendingTimers,
  ComponentFixture,
  tick,
  flushMicrotasks,
} from 'angular2/testing_internal';

import {AnimationMetadata} from 'angular2/src/core/metadata/animations';
import {RuntimeAnimationCompiler} from 'angular2/src/compiler/animation/runtime_animation_compiler';
import {style, animate, group, sequence} from 'angular2/src/core/metadata/animations';

export function main() {
  describe('RuntimeAnimationCompiler', () => {
    var compiler = new RuntimeAnimationCompiler();

    var compileAnimations = (animations: {[key: string]: AnimationMetadata}) => {
      return compiler.compileAnimations(animations);
    };

    var compile = (event: string, animation: AnimationMetadata) => {
      var animations: {[key: string]: AnimationMetadata} = {};
      animations[event] = animation;
      return compileAnimations(animations);
    };

    it('should throw an exception containing all the inner animation parser errors', () => {
      var animation = sequence([
        style({"color": "red"}),
        animate({"font-size": "100px"}, 1000),
        style({"color": "blue"}),
        animate(null, 1000),
        style({"color": "gold"}),
      ]);

      var capturedErrorMessage: string;
      try {
        compile('ngEnter', animation);
      } catch (e) {
        capturedErrorMessage = e.message;
      }

      expect(capturedErrorMessage)
          .toMatchPattern(
              /Unable to parse the animation sequence for "ngEnter" due to the following errors/g);

      expect(capturedErrorMessage)
          .toMatchPattern(/- One or more pending style\(\.\.\.\) animations remain/g);

      expect(capturedErrorMessage)
          .toMatchPattern(/- "null" is not a valid key\/value style object/g);
    });
  });
}
