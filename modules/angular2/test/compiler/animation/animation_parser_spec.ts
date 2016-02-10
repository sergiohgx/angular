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

import {
  parseAnimationMetadata,
  parseAnimationEvent
} from 'angular2/src/compiler/animation/animation_parser';
import {style, animate, group, sequence} from 'angular2/src/core/metadata/animations';

import {
  AnimationEvent,
  EnterAnimationEvent,
  LeaveAnimationEvent,
  AddClassAnimationEvent,
  RemoveClassAnimationEvent,
  SetAttributeAnimationEvent,
  RemoveAttributeAnimationEvent
} from 'angular2/src/compiler/animation/animation_event';

import {
  AnimationMetadata,
  AnimationWithStepsMetadata,
  AnimationStyleMetadata,
  AnimationAnimateMetadata,
  AnimationGroupMetadata,
  AnimationSequenceMetadata
} from 'angular2/src/core/metadata/animations';

import {
  AnimationAst,
  AnimationKeyframeAst,
  AnimationKeyframeStylesAst,
  AnimationSequenceAst,
  AnimationGroupAst,
  AnimationStyleStepAst,
  AnimationAnimateStepAst
} from 'angular2/src/compiler/animation/animation_ast';

export function main() {
  describe('parseAnimationEvent', () => {
    var parseEvent = (name: string) => parseAnimationEvent(name).event;
    var parseEventAndGetErrors = (name: string) => parseAnimationEvent(name).errors;

    it('should parse the given animaton event into its associated AST', () => {
      expect(parseEvent('ngEnter') instanceof EnterAnimationEvent).toBeTruthy();
      expect(parseEvent('ngLeave') instanceof LeaveAnimationEvent).toBeTruthy();
      expect(parseEvent('addClass') instanceof AddClassAnimationEvent).toBeTruthy();
      expect(parseEvent('removeClass') instanceof RemoveClassAnimationEvent).toBeTruthy();
      expect(parseEvent('setAttribute') instanceof SetAttributeAnimationEvent).toBeTruthy();
      expect(parseEvent('removeAttribute') instanceof RemoveAttributeAnimationEvent).toBeTruthy();
    });

    it('should not allow ngEnter/ngLeave to set any parameters', () => {
      expect(parseEventAndGetErrors('ngEnter(someParam)').length).toEqual(1);
      expect(parseEventAndGetErrors('ngEnter(someParam="someValue")').length).toEqual(1);
      expect(parseEventAndGetErrors('ngLeave(someParam)').length).toEqual(1);
      expect(parseEventAndGetErrors('ngLeave(someParam="someValue")').length).toEqual(1);
    });

    it('should allow addClass/removeClass to set a className value to be provided as a param',
       () => {
         expect(parseEventAndGetErrors('addClass(someClass)').length).toEqual(0);
         expect(parseEventAndGetErrors('removeClass(someClass)').length).toEqual(0);
       });

    it('should allow removeAttribute to set a attributeName value to be provided as a param',
       () => { expect(parseEventAndGetErrors('removeAttribute(someAttr)').length).toEqual(0); });

    it('should allow setAttribute to set attributeName and/or attributeValue values to be provided as params',
       () => {
         expect(parseEventAndGetErrors('setAttribute(someAttr)').length).toEqual(0);
         expect(parseEventAndGetErrors('setAttribute(someAttr="someValue")').length).toEqual(0);
       });

    it('should return an error when an event name is not supported', () => {
      var errors = parseEventAndGetErrors('someFakeEvent');
      expect(errors[0].msg)
          .toContainError(`The animation event name "someFakeEvent" is not a supported animation`);
    });

    it('should return an error is an event name contains unbalanced quotes for a event parameter value',
       () => {
         var errors = parseEventAndGetErrors('setAttribute(value="something)');
         expect(errors[0].msg).toContainError(`Unbalanced string value " "something " detected`);
       });

    it('should return an error if event parameters are set on an animation event that doesn\'t support them',
       () => {
         var errors1 = parseEventAndGetErrors('ngEnter(someParam)');
         expect(errors1[0].msg)
             .toContainError(`ngEnter is not allowed to take in any event parameters`);

         var errors2 = parseEventAndGetErrors('removeAttribute(someParam=someValue)');
         expect(errors2[0].msg)
             .toContainError(
                 `removeAttribute is not allowed to take in more then one event parameters`);
       });

    it('should collect and return any errors collected when parsing the event', () => {
      var errors = parseEventAndGetErrors('customEvent(value="something)');
      expect(errors.length).toBeGreaterThan(1);
    });
  });

  describe('parseAnimationMetadata', () => {
    var collectKeyframeStyles =
        (keyframe: AnimationKeyframeAst): {[key: string]: string | number} => {
          return keyframe.styles[0].styles;
        }

    var collectStepStyles = (step: AnimationAnimateStepAst | AnimationStyleStepAst):
        Array<{[key: string]: string | number}> => {
          var keyframes: AnimationKeyframeAst[];
          if (step instanceof AnimationAnimateStepAst) {
            keyframes = step.keyframes;
          } else {
            keyframes = [(<AnimationStyleStepAst>step).keyframe];
          }
          return keyframes.map(keyframe => collectKeyframeStyles(keyframe));
        }

    var parseAnimation =
        (data: AnimationMetadata[]) => { return parseAnimationMetadata(sequence(data)); };

    var parseAnimationAndGetErrors =
        (data: AnimationMetadata[]) => { return parseAnimation(data).errors; };

    it('should merge repeated style steps into a single style ast step entry', () => {
      var details = parseAnimation([
        style({"color": 'black'}),
        style({"background": 'red'}),
        style({"opacity": 0}),
        animate({"color": 'white', "background": 'black', "opacity": 1}, 1000)
      ]);

      var ast = <AnimationSequenceAst>details.ast;
      expect(ast.steps.length).toEqual(2);

      var styleStep = <AnimationStyleStepAst>ast.steps[0];
      expect(styleStep.keyframe.styles[0].styles)
          .toEqual({"color": 'black', "background": 'red', "opacity": 0});
    });

    it('should animate only the styles requested within an animation step', () => {
      var details = parseAnimation([
        style({"color": 'black', "background": 'blue'}),
        animate({"background": 'orange'}, 1000)
      ]);

      var ast = <AnimationSequenceAst>details.ast;
      expect(ast.steps.length).toEqual(2);

      var animateStep = <AnimationAnimateStepAst>ast.steps[1];
      var fromKeyframe = animateStep.keyframes[0].styles[0].styles;
      var toKeyframe = animateStep.keyframes[1].styles[0].styles;
      expect(fromKeyframe).toEqual({"background": 'blue'});
      expect(toKeyframe).toEqual({"background": 'orange'});
    });

    it('should populate the starting and duration times propertly', () => {
      var details = parseAnimation([
        style({"color": 'black', "opacity": 1}),
        animate({"color": 'red'}, 1000),
        animate({"color": 'yellow'}, 4000),
        sequence([animate({"color": 'blue'}, 1000), animate({"color": 'grey'}, 1000)]),
        group([animate({"color": 'pink'}, 500), animate({"opacity": '0.5'}, 1000)]),
        animate({"color": 'black'}, 300),
      ]);

      var ast = <AnimationSequenceAst>details.ast;
      expect(ast.steps.length).toEqual(6);

      var step1 = <AnimationStyleStepAst>ast.steps[0];
      expect(step1.playTime).toEqual(0);
      expect(step1.startTime).toEqual(0);

      var step2 = <AnimationAnimateStepAst>ast.steps[1];
      expect(step2.playTime).toEqual(1000);
      expect(step2.startTime).toEqual(0);

      var step3 = <AnimationAnimateStepAst>ast.steps[2];
      expect(step3.playTime).toEqual(4000);
      expect(step3.startTime).toEqual(1000);

      var seq = <AnimationSequenceAst>ast.steps[3];
      expect(seq.playTime).toEqual(2000);
      expect(seq.startTime).toEqual(5000);

      var step4 = <AnimationAnimateStepAst>seq.steps[0];
      expect(step4.playTime).toEqual(1000);
      expect(step4.startTime).toEqual(5000);

      var step5 = <AnimationAnimateStepAst>seq.steps[1];
      expect(step5.playTime).toEqual(1000);
      expect(step5.startTime).toEqual(6000);

      var grp = <AnimationGroupAst>ast.steps[4];
      expect(grp.playTime).toEqual(1000);
      expect(grp.startTime).toEqual(7000);

      var step6 = <AnimationAnimateStepAst>grp.steps[0];
      expect(step6.playTime).toEqual(500);
      expect(step6.startTime).toEqual(7000);

      var step7 = <AnimationAnimateStepAst>grp.steps[1];
      expect(step7.playTime).toEqual(1000);
      expect(step7.startTime).toEqual(7000);

      var step8 = <AnimationAnimateStepAst>ast.steps[5];
      expect(step8.playTime).toEqual(300);
      expect(step8.startTime).toEqual(8000);
    });

    it('should apply the correct animate() styles when parallel animations are active and use the same properties',
       () => {
         var details = parseAnimation([
           style({"opacity": 0, "color": 'red'}),
           group([
             sequence([
               animate({"color": "black"}, 2000),
               animate({"opacity": 0.5}, 2000),
             ]),
             sequence([animate({"opacity": 0.8}, 2000), animate({"color": "blue"}, 2000)])
           ])
         ]);

         var errors = details.errors;
         expect(errors.length).toEqual(0);

         var ast = <AnimationSequenceAst>details.ast;
         var g1 = <AnimationGroupAst>ast.steps[1];

         var sq1 = <AnimationSequenceAst>g1.steps[0];
         var sq2 = <AnimationSequenceAst>g1.steps[1];

         var sq1a1 = <AnimationAnimateStepAst>sq1.steps[0];
         expect(collectStepStyles(sq1a1)).toEqual([{"color": 'red'}, {"color": 'black'}]);

         var sq1a2 = <AnimationAnimateStepAst>sq1.steps[1];
         expect(collectStepStyles(sq1a2)).toEqual([{"opacity": 0.8}, {"opacity": 0.5}]);

         var sq2a1 = <AnimationAnimateStepAst>sq2.steps[0];
         expect(collectStepStyles(sq2a1)).toEqual([{"opacity": 0}, {"opacity": 0.8}]);

         var sq2a2 = <AnimationAnimateStepAst>sq2.steps[1];
         expect(collectStepStyles(sq2a2)).toEqual([{"color": "black"}, {"color": "blue"}]);
       });

    it('should throw errors when animations animate a CSS property at the same time', () => {
      var animation1 = parseAnimation([
        style({"opacity": 0}),
        group([animate({"opacity": 1}, 1000), animate({"opacity": 0.5}, 2000)])
      ]);

      var errors1 = animation1.errors;
      expect(errors1.length).toEqual(1);
      expect(errors1[0].msg)
          .toContainError(
              'The animated CSS property "opacity" unexpectedly changes between steps "0ms" and "2000ms" at "1000ms"');

      var animation2 = parseAnimation([
        style({"color": "red"}),
        group([animate({"color": "blue"}, 5000), animate({"color": "black"}, 2500)])
      ]);

      var errors2 = animation2.errors;
      expect(errors2.length).toEqual(1);
      expect(errors2[0].msg)
          .toContainError(
              'The animated CSS property "color" unexpectedly changes between steps "0ms" and "5000ms" at "2500ms"');
    });

    it('should throw an error if style is being animated that was not set within an earlier style step',
       () => {
         var errors = parseAnimationAndGetErrors(
             [style({"color": 'black'}), animate({"color": 'white', "background": 'black'}, 1000)]);
         expect(errors[0].msg)
             .toContainError(
                 `The CSS style:value entry "background:black" cannot be animated because "background" has not been styled within a previous style step`);
       });

    it('should return an error if a non-stringmap value is being animated', () => {
      var errors = parseAnimationAndGetErrors([style({"opacity": 0}), animate(null, 1000)]);
      expect(errors[0].msg).toContainError('"null" is not a valid key/value style object');
    });

    it('should return an error if no styles were set to be animated within a sequence', () => {
      var errors = parseAnimationAndGetErrors([style({"opacity": 0}), style({"opacity": 1})]);
      expect(errors[0].msg).toContainError('One or more pending style(...) animations remain');
    });

    it('should return an error when an animation style contains an invalid timing value', () => {
      var errors = parseAnimationAndGetErrors(
          [style({"opacity": 0}), animate({"opacity": 1}, 'one second')]);
      expect(errors[0].msg).toContainError(`The provided timing value "one second" is invalid.`);
    });

    it('should collect and return any errors collected when parsing the metadata', () => {
      var errors = parseAnimationAndGetErrors([
        style({"opacity": 0}),
        animate({"opacity": 1}, 'one second'),
        style({"opacity": 0}),
        animate(null, 'one second'),
        style({"background": 'red'})
      ]);
      expect(errors.length).toBeGreaterThan(1);
    });
  });
}
