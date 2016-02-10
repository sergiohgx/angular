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

import {MockNgZone} from 'angular2/src/mock/ng_zone_mock';

import {NgZone} from 'angular2/core';

import {isPresent} from 'angular2/src/facade/lang';

import {
  Injector,
  bind,
  provide,
  Injectable,
  Provider,
  forwardRef,
  OpaqueToken,
  Inject,
  Host,
  SkipSelf,
  SkipSelfMetadata,
  OnDestroy
} from 'angular2/core';

import {CompilerConfig} from 'angular2/compiler';

import {
  Directive,
  Component,
  ViewMetadata,
  Attribute,
  Query,
  Pipe,
  Input,
  Output,
  HostBinding,
  HostListener
} from 'angular2/src/core/metadata';

import {AnimationDriver} from 'angular2/src/core/render/animation_driver';
import {MockAnimationDriver} from 'angular2/src/mock/mock_animation_driver';
import {style, animate, group, sequence} from 'angular2/animate';
import {IS_DART} from 'angular2/src/facade/lang';

export function main() {
  if (IS_DART) {
    declareTests();
  } else {
    describe('jit', () => {
      beforeEachProviders(
          () => [provide(CompilerConfig, {useValue: new CompilerConfig(true, false, true)})]);
      declareTests();
    });

    describe('no jit', () => {
      beforeEachProviders(
          () => [provide(CompilerConfig, {useValue: new CompilerConfig(true, false, false)})]);
      declareTests();
    });
  }
}

function declareTests() {
  describe('animation tests', function() {
    beforeEachProviders(() => [provide(AnimationDriver, {useClass: MockAnimationDriver})]);

    var makeAnimationCmp = (tcb: TestComponentBuilder, tpl: string, animationName: string,
                            animation: any[], callback = null) => {
      var animations = {};
      animations[animationName] = animation;

      var fixture: ComponentFixture;
      tcb = tcb.overrideTemplate(DummyIfCmp, tpl);
      tcb = tcb.overrideAnimations(DummyIfCmp, animations);
      tcb.createAsync(DummyIfCmp).then((root) => { callback(root); });
      tick();
    };

    describe('animation triggers', () => {
      it('should trigger a ngEnter animation',
         inject([TestComponentBuilder, AnimationDriver, NgZone],
                fakeAsync(
                    (tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
                      makeAnimationCmp(tcb, '<div *ngIf="exp"></div>', 'ngEnter',
                                       [style({'opacity': 0}), animate({'opacity': 1}, 500)],
                                       (fixture) => {
                                         var cmp = fixture.debugElement.componentInstance;
                                         cmp.exp = true;
                                         fixture.detectChanges();
                                         flushMicrotasks();
                                         zone.simulateMicrotaskEmpty();

                                         expect(driver.log.length).toEqual(2);

                                         var keyframes1 = driver.log[0]['keyframeLookup'];
                                         expect(keyframes1.length).toEqual(1);
                                         expect(keyframes1[0]).toEqual([100, {'opacity': 0}]);

                                         var keyframes2 = driver.log[1]['keyframeLookup'];
                                         expect(keyframes2.length).toEqual(2);
                                         expect(keyframes2[0]).toEqual([0, {'opacity': 0}]);
                                         expect(keyframes2[1]).toEqual([100, {'opacity': 1}]);
                                       });
                    })));

      it('should trigger a ngLeave animation',
         inject([TestComponentBuilder, AnimationDriver, NgZone],
                fakeAsync(
                    (tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

                      makeAnimationCmp(tcb, '<div *ngIf="exp"></div>', 'ngLeave',
                                       [style({'width': 100}), animate({'width': 0}, 500)],
                                       (fixture) => {

                                         var cmp = fixture.debugElement.componentInstance;
                                         cmp.exp = true;
                                         fixture.detectChanges();
                                         flushMicrotasks();
                                         zone.simulateMicrotaskEmpty();

                                         expect(driver.log.length).toEqual(0);

                                         cmp.exp = false;
                                         fixture.detectChanges();
                                         flushMicrotasks();
                                         zone.simulateMicrotaskEmpty();

                                         expect(driver.log.length).toEqual(2);

                                         var keyframes = driver.log[1]['keyframeLookup'];
                                         expect(keyframes[0]).toEqual([0, {'width': 100}]);
                                         expect(keyframes[1]).toEqual([100, {'width': 0}]);
                                       });
                    })));

      it('should trigger an addClass animation',
         inject([TestComponentBuilder, AnimationDriver, NgZone],
                fakeAsync(
                    (tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

                      makeAnimationCmp(
                          tcb, '<div [class.something]="exp"></div>', 'addClass',
                          [style({'border-width': 10}), animate({'border-width': 100}, 500)],
                          (fixture) => {

                            var cmp = fixture.debugElement.componentInstance;
                            cmp.exp = true;
                            fixture.detectChanges();
                            flushMicrotasks();
                            zone.simulateMicrotaskEmpty();

                            expect(driver.log.length).toEqual(2);

                            var keyframes = driver.log[1]['keyframeLookup'];
                            expect(keyframes[0]).toEqual([0, {'border-width': 10}]);
                            expect(keyframes[1]).toEqual([100, {'border-width': 100}]);
                          });
                    })));

      it('should trigger a removeClass animation',
         inject([TestComponentBuilder, AnimationDriver, NgZone],
                fakeAsync(
                    (tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

                      makeAnimationCmp(
                          tcb, '<div [class.something]="exp"></div>', 'removeClass',
                          [style({'border-color': 'red'}), animate({'border-color': 'blue'}, 500)],
                          (fixture) => {

                            var cmp = fixture.debugElement.componentInstance;
                            cmp.exp = true;
                            fixture.detectChanges();
                            flushMicrotasks();
                            zone.simulateMicrotaskEmpty();

                            expect(driver.log.length).toEqual(0);

                            cmp.exp = false;
                            fixture.detectChanges();
                            flushMicrotasks();
                            zone.simulateMicrotaskEmpty();

                            expect(driver.log.length).toEqual(2);

                            var keyframes = driver.log[1]['keyframeLookup'];
                            expect(keyframes[0]).toEqual([0, {'border-color': 'red'}]);
                            expect(keyframes[1]).toEqual([100, {'border-color': 'blue'}]);
                          });
                    })));

      it('should trigger a setAttribute animation',
         inject([TestComponentBuilder, AnimationDriver, NgZone],
                fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver,
                           zone: MockNgZone) => {

                  makeAnimationCmp(tcb, '<div [attr.title]="exp"></div>', 'setAttribute',
                                   [style({'font-size': '10px'}), animate({'font-size': 0}, 500)],
                                   (fixture) => {

                                     var cmp = fixture.debugElement.componentInstance;
                                     cmp.exp = 'title';
                                     fixture.detectChanges();
                                     flushMicrotasks();
                                     zone.simulateMicrotaskEmpty();

                                     expect(driver.log.length).toEqual(2);

                                     var keyframes = driver.log[1]['keyframeLookup'];
                                     expect(keyframes[0]).toEqual([0, {'font-size': '10px'}]);
                                     expect(keyframes[1]).toEqual([100, {'font-size': 0}]);
                                   });
                })));

      it('should trigger a removeAttribute animation',
         inject([TestComponentBuilder, AnimationDriver, NgZone],
                fakeAsync(
                    (tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

                      makeAnimationCmp(tcb, '<div [attr.title]="exp"></div>', 'removeAttribute',
                                       [style({'z-index': '1'}), animate({'z-index': 10}, 500)],
                                       (fixture) => {

                                         var cmp = fixture.debugElement.componentInstance;
                                         cmp.exp = 'title';
                                         fixture.detectChanges();
                                         flushMicrotasks();
                                         zone.simulateMicrotaskEmpty();

                                         expect(driver.log.length).toEqual(0);

                                         cmp.exp = null;
                                         fixture.detectChanges();
                                         flushMicrotasks();
                                         zone.simulateMicrotaskEmpty();

                                         expect(driver.log.length).toEqual(2);

                                         var keyframes = driver.log[1]['keyframeLookup'];
                                         expect(keyframes[0]).toEqual([0, {'z-index': '1'}]);
                                         expect(keyframes[1]).toEqual([100, {'z-index': 10}]);
                                       });
                    })));
    });

    describe('animation operations', () => {
      it('should animate the element when the expression changes',
         inject([TestComponentBuilder, AnimationDriver, NgZone],
                fakeAsync(
                    (tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
                      tcb.overrideAnimations(DummyIfCmp,
                                             {
                                               "ngEnter": [
                                                 style({'background': 'red'}),
                                                 animate({'background': 'blue'}, '0.5s 1s ease-out')
                                               ]
                                             })
                          .createAsync(DummyIfCmp)
                          .then((fixture) => {
                            tick();

                            var cmp = fixture.debugElement.componentInstance;
                            cmp.exp = true;
                            fixture.detectChanges();

                            flushMicrotasks();
                            zone.simulateMicrotaskEmpty();

                            expect(driver.log.length).toEqual(2);

                            var animation1 = driver.log[0];
                            expect(animation1['duration']).toEqual(0);
                            expect(animation1['delay']).toEqual(0);
                            expect(animation1['easing']).toEqual(null);
                            expect(animation1['keyframeLookup'].length).toEqual(1);

                            var animation2 = driver.log[1];
                            expect(animation2['duration']).toEqual(500);
                            expect(animation2['delay']).toEqual(1000);
                            expect(animation2['easing']).toEqual('ease-out');

                            var keyframes = animation2['keyframeLookup'];
                            expect(keyframes[0]).toEqual([0, {'background': 'red'}]);
                            expect(keyframes[1]).toEqual([100, {'background': 'blue'}]);
                          });
                    })));

      it('should combine repeated style steps into a single step',
         inject(
             [TestComponentBuilder, AnimationDriver, NgZone],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver,
                        zone: MockNgZone) => {
               tcb.overrideAnimations(
                      DummyIfCmp,
                      {
                        "ngEnter": [
                          style({'background': 'red'}),
                          style({'width': '100px'}),
                          style({'background': 'gold'}),
                          style({'height': 111}),
                          animate({'width': '200px', 'background': 'blue'}, '999ms'),
                          style({'opacity': '1'}),
                          style({'border-width': '100px'}),
                          animate({'opacity': '0', 'height': '200px', 'border-width': '10px'},
                                  '999ms')
                        ]
                      })
                   .createAsync(DummyIfCmp)
                   .then((fixture) => {
                     tick();

                     var cmp = fixture.debugElement.componentInstance;
                     cmp.exp = true;
                     fixture.detectChanges();

                     flushMicrotasks();
                     zone.simulateMicrotaskEmpty();

                     expect(driver.log.length).toEqual(4);

                     var animation1 = driver.log[0];
                     expect(animation1['duration']).toEqual(0);
                     expect(animation1['delay']).toEqual(0);
                     expect(animation1['easing']).toEqual(null);

                     var keyframes1 = animation1['keyframeLookup'];
                     expect(keyframes1.length).toEqual(1);
                     expect(keyframes1[0])
                         .toEqual([100, {'background': 'gold', 'width': '100px', 'height': 111}]);

                     var animation2 = driver.log[1];
                     expect(animation2['duration']).toEqual(999);
                     expect(animation2['delay']).toEqual(0);
                     expect(animation2['easing']).toEqual(null);

                     var keyframes2 = animation2['keyframeLookup'];
                     expect(keyframes2[0]).toEqual([0, {'background': 'gold', 'width': '100px'}]);

                     expect(keyframes2[1]).toEqual([100, {'background': 'blue', 'width': '200px'}]);

                     var animation3 = driver.log[2];
                     expect(animation3['duration']).toEqual(0);
                     expect(animation3['delay']).toEqual(0);
                     expect(animation3['easing']).toEqual(null);

                     var keyframes3 = animation3['keyframeLookup'];
                     expect(keyframes3.length).toEqual(1);
                     expect(keyframes3[0])
                         .toEqual([100, {'opacity': '1', 'border-width': '100px'}]);

                     var animation4 = driver.log[3];
                     expect(animation4['duration']).toEqual(999);
                     expect(animation4['delay']).toEqual(0);
                     expect(animation4['easing']).toEqual(null);

                     var keyframes4 = animation4['keyframeLookup'];
                     expect(keyframes4[0])
                         .toEqual([0, {'opacity': '1', 'height': 111, 'border-width': '100px'}]);

                     expect(keyframes4[1])
                         .toEqual(
                             [100, {'opacity': '0', 'height': '200px', 'border-width': '10px'}]);
                   });
             })));

      describe('groups/sequences', () => {
        var assertPlaying =
            (player, isPlaying) => {
              var method = 'play';
              var lastEntry = player.log.length > 0 ? player.log[player.log.length - 1] : null;
              if (isPresent(lastEntry)) {
                if (isPlaying) {
                  expect(lastEntry).toEqual(method);
                } else {
                  expect(lastEntry).not.toEqual(method);
                }
              }
            }

        it('should run animations in sequence one by one if a top-level array is used',
           inject([TestComponentBuilder, AnimationDriver, NgZone],
                  fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver,
                             zone: MockNgZone) => {
                    tcb.overrideAnimations(DummyIfCmp,
                                           {
                                             "ngEnter": [
                                               style({'opacity': '0'}),
                                               animate({'opacity': '0.5'}, 1000),
                                               animate({'opacity': '0.8'}, '1000ms'),
                                               animate({'opacity': '1'}, '1s'),
                                             ]
                                           })
                        .createAsync(DummyIfCmp)
                        .then((fixture) => {

                          tick();

                          var cmp = fixture.debugElement.componentInstance;
                          cmp.exp = true;
                          fixture.detectChanges();

                          flushMicrotasks();
                          zone.simulateMicrotaskEmpty();

                          expect(driver.log.length).toEqual(4);

                          var player1 = driver.log[0]['player'];
                          var player2 = driver.log[1]['player'];
                          var player3 = driver.log[2]['player'];
                          var player4 = driver.log[3]['player'];

                          assertPlaying(player1, true);
                          assertPlaying(player2, false);
                          assertPlaying(player3, false);
                          assertPlaying(player4, false);

                          player1.finish();

                          assertPlaying(player1, false);
                          assertPlaying(player2, true);
                          assertPlaying(player3, false);
                          assertPlaying(player4, false);

                          player2.finish();

                          assertPlaying(player1, false);
                          assertPlaying(player2, false);
                          assertPlaying(player3, true);
                          assertPlaying(player4, false);

                          player3.finish();

                          assertPlaying(player1, false);
                          assertPlaying(player2, false);
                          assertPlaying(player3, false);
                          assertPlaying(player4, true);

                          player4.finish();

                          assertPlaying(player1, false);
                          assertPlaying(player2, false);
                          assertPlaying(player3, false);
                          assertPlaying(player4, false);
                        });
                  })));

        it('should run animations in parallel if a group is used',
           inject(
               [TestComponentBuilder, AnimationDriver, NgZone],
               fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver,
                          zone: MockNgZone) => {
                 tcb.overrideAnimations(
                        DummyIfCmp,
                        {
                          "ngEnter": [
                            style({'width': 0, 'height': 0}),
                            group([animate({'width': 100}, 1000), animate({'height': 500}, 5000)]),
                            group([animate({'width': 0}, 1000), animate({'height': 0}, 5000)])
                          ]
                        })
                     .createAsync(DummyIfCmp)
                     .then((fixture) => {

                       tick();

                       var cmp = fixture.debugElement.componentInstance;
                       cmp.exp = true;
                       fixture.detectChanges();

                       flushMicrotasks();
                       zone.simulateMicrotaskEmpty();

                       expect(driver.log.length).toEqual(5);

                       var player1 = driver.log[0]['player'];
                       var player2 = driver.log[1]['player'];
                       var player3 = driver.log[2]['player'];
                       var player4 = driver.log[3]['player'];
                       var player5 = driver.log[4]['player'];

                       assertPlaying(player1, true);
                       assertPlaying(player2, false);
                       assertPlaying(player3, false);
                       assertPlaying(player4, false);
                       assertPlaying(player5, false);

                       player1.finish();

                       assertPlaying(player1, false);
                       assertPlaying(player2, true);
                       assertPlaying(player3, true);
                       assertPlaying(player4, false);
                       assertPlaying(player5, false);

                       player2.finish();

                       assertPlaying(player1, false);
                       assertPlaying(player2, false);
                       assertPlaying(player3, true);
                       assertPlaying(player4, false);
                       assertPlaying(player5, false);

                       player3.finish();

                       assertPlaying(player1, false);
                       assertPlaying(player2, false);
                       assertPlaying(player3, false);
                       assertPlaying(player4, true);
                       assertPlaying(player5, true);
                     });
               })));
      });

      it('should cancel an existing running animation on the same element when a follow-up structural animation is run',
         inject([TestComponentBuilder, AnimationDriver, NgZone],
                fakeAsync(
                    (tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
                      tcb.overrideAnimations(
                             DummyIfCmp,
                             {
                               "ngEnter": [style({'width': 0}), animate({'width': 100}, 1000)],
                               "ngLeave": [style({'height': 100}), animate({'height': 0}, 1000)]
                             })
                          .createAsync(DummyIfCmp)
                          .then((fixture) => {

                            tick();

                            var cmp = fixture.debugElement.componentInstance;

                            cmp.exp = true;
                            fixture.detectChanges();
                            flushMicrotasks();
                            zone.simulateMicrotaskEmpty();

                            var enterCompleted = false;
                            var enterPlayer = driver.log[1]['player'];
                            enterPlayer.onDone(() => enterCompleted = true);

                            expect(enterCompleted).toEqual(false);

                            cmp.exp = false;
                            fixture.detectChanges();
                            flushMicrotasks();
                            zone.simulateMicrotaskEmpty();

                            expect(enterCompleted).toEqual(true);
                          });
                    })));

      it('should destroy all animation players once the animation is complete',
         inject([TestComponentBuilder, AnimationDriver, NgZone],
                fakeAsync(
                    (tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
                      tcb.overrideAnimations(DummyIfCmp,
                                             {
                                               "ngEnter": [
                                                 style({'background': 'red', 'opacity': 0.5}),
                                                 animate({'background': 'black'}, 500),
                                                 group([
                                                   animate({'background': 'black'}, 500),
                                                   animate({'opacity': '0.2'}, 1000),
                                                 ]),
                                                 sequence([
                                                   animate({'opacity': '1'}, 500),
                                                   animate({'background': 'white'}, 1000)
                                                 ])
                                               ]
                                             })
                          .createAsync(DummyIfCmp)
                          .then((fixture) => {
                            tick();

                            var cmp = fixture.debugElement.componentInstance;
                            cmp.exp = true;
                            fixture.detectChanges();

                            flushMicrotasks();
                            zone.simulateMicrotaskEmpty();

                            expect(driver.log.length).toEqual(6);

                            driver.log.forEach(entry => entry['player'].finish());
                            driver.log.forEach(entry => {
                              var player = entry['player'];
                              expect(player.log[player.log.length - 2]).toEqual('finish');
                              expect(player.log[player.log.length - 1]).toEqual('destroy');
                            });
                          });
                    })));
    });

    it('should animate the addClass/removeClass animation with the most accurate match to the provided event and data',
       inject(
           [TestComponentBuilder, AnimationDriver, NgZone],
           fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
             tcb = tcb.overrideTemplate(DummyIfCmp, `
                      <div [class.black]="exp"></div>
                      <div [class.red]="exp2"></div>
                    `);
             tcb.overrideAnimations(
                    DummyIfCmp,
                    {
                      "addClass(red)": [style({'color': 'white'}), animate({'color': 'red'}, 500)],
                      "addClass": [style({'color': 'white'}), animate({'color': 'black'}, 500)]
                    })
                 .createAsync(DummyIfCmp)
                 .then((fixture) => {
                   tick();

                   var cmp = fixture.debugElement.componentInstance;

                   cmp.exp = true;
                   fixture.detectChanges();
                   flushMicrotasks();
                   zone.simulateMicrotaskEmpty();

                   expect(driver.log.length).toEqual(2);

                   var animation1 = driver.log[1];
                   var keyframes1 = animation1['keyframeLookup'];
                   var toStyles1 = keyframes1[1][1];
                   expect(toStyles1['color']).toEqual('black');

                   cmp.exp2 = true;
                   fixture.detectChanges();
                   flushMicrotasks();
                   zone.simulateMicrotaskEmpty();

                   expect(driver.log.length).toEqual(4);

                   var animation2 = driver.log[3];
                   var keyframes2 = animation2['keyframeLookup'];
                   var toStyles2 = keyframes2[1][1];
                   expect(toStyles2['color']).toEqual('red');
                 });
           })));

    it('should animate the setAttribute animation with the most accurate match to the provided event and data',
       inject(
           [TestComponentBuilder, AnimationDriver, NgZone],
           fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
             tcb = tcb.overrideTemplate(DummyIfCmp, `
                      <div [attr.title]="exp" [attr.id]="exp2"></div>
                    `);
             tcb.overrideAnimations(
                    DummyIfCmp,
                    {
                      "setAttribute(title='gold')":
                          [style({'color': 'white'}), animate({'color': 'gold'}, 500)],
                      "setAttribute(title)":
                          [style({'color': 'white'}), animate({'color': 'blue'}, 500)],
                      "setAttribute": [style({'color': 'white'}), animate({'color': 'grey'}, 500)]
                    })
                 .createAsync(DummyIfCmp)
                 .then((fixture) => {
                   tick();

                   var cmp = fixture.debugElement.componentInstance;

                   cmp.exp = 'gold';
                   cmp.exp2 = null;
                   fixture.detectChanges();
                   flushMicrotasks();
                   zone.simulateMicrotaskEmpty();

                   expect(driver.log.length).toEqual(2);

                   var animation1 = driver.log[1];
                   var keyframes1 = animation1['keyframeLookup'];
                   var toStyles1 = keyframes1[1][1];
                   expect(toStyles1['color']).toEqual('gold');

                   driver.log = [];

                   cmp.exp = 'blue';
                   fixture.detectChanges();
                   flushMicrotasks();
                   zone.simulateMicrotaskEmpty();

                   expect(driver.log.length).toEqual(2);

                   var animation2 = driver.log[1];
                   var keyframes2 = animation2['keyframeLookup'];
                   var toStyles2 = keyframes2[1][1];
                   expect(toStyles2['color']).toEqual('blue');

                   driver.log = [];

                   cmp.exp2 = 'something dark';
                   fixture.detectChanges();
                   flushMicrotasks();
                   zone.simulateMicrotaskEmpty();

                   expect(driver.log.length).toEqual(2);

                   var animation3 = driver.log[1];
                   var keyframes3 = animation3['keyframeLookup'];
                   var toStyles3 = keyframes3[1][1];
                   expect(toStyles3['color']).toEqual('grey');
                 });
           })));
  });
}

@Component({
  selector: 'if-cmp',
  template: `
    <div *ngIf="exp"></div>
  `
})
class DummyIfCmp {
  exp = false;
  exp2 = false;
}
