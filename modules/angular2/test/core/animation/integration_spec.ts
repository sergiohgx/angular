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

import {
  PipeTransform,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  ChangeDetectorGenConfig
} from 'angular2/src/core/change_detection/change_detection';

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

import {AnimationDriver} from 'angular2/src/core/animation/animation_driver';
import {MockAnimationDriver} from 'angular2/src/mock/animation/mock_animation_driver';
import {style, animate, group, sequence} from 'angular2/animate';

export function main() {
  describe('animation tests', function() {
    beforeEachProviders(() => [
      provide(AnimationDriver, { useClass: MockAnimationDriver }),
      // TODO (matsko): remove this line once Tobias' changedetection refactor PR is in
      provide(ChangeDetectorGenConfig, { useValue: new ChangeDetectorGenConfig(true, false, false)})
    ]);

    var makeAnimationCmp = (tcb: TestComponentBuilder, tpl: string, animationName: string, animation: any[]) => {
      var animations = {};
      animations[animationName] = animation;

      var fixture: ComponentFixture;
      tcb = tcb.overrideTemplate(DummyIfCmp, tpl);
      tcb = tcb.overrideAnimations(DummyIfCmp, animations);
      tcb.createAsync(DummyIfCmp).then((root) => {
        fixture = root;
      });

      tick();
      return fixture;
    };

    describe('animation triggers', () => {
      it('should trigger a ngEnter animation',
        inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

        var fixture = makeAnimationCmp(tcb, '<div *ngIf="exp"></div>', 'ngEnter', [
          style({ 'opacity': 0 }),
          animate({ 'opacity': 1 }, 500)
        ]);

        var cmp = fixture.debugElement.componentInstance;
        cmp.exp = true;
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(1);

        var keyframes = driver.log[0]['keyframeLookup'];
        expect(keyframes[0]).toEqual([0, { 'opacity': '0' }]);
        expect(keyframes[1]).toEqual([100, { 'opacity': '1' }]);
      })));

      it('should trigger a ngLeave animation',
        inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

        var fixture = makeAnimationCmp(tcb, '<div *ngIf="exp"></div>', 'ngLeave', [
          style({ 'width': 100 }),
          animate({ 'width': 0 }, 500)
        ]);

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

        expect(driver.log.length).toEqual(1);

        var keyframes = driver.log[0]['keyframeLookup'];
        expect(keyframes[0]).toEqual([0, { 'width': '100px' }]);
        expect(keyframes[1]).toEqual([100, { 'width': '0px' }]);
      })));

      it('should trigger an addClass animation',
        inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

        var fixture = makeAnimationCmp(tcb, '<div [class.something]="exp"></div>', 'addClass', [
          style({ 'border-width': 10 }),
          animate({ 'border-width': 100 }, 500)
        ]);

        var cmp = fixture.debugElement.componentInstance;
        cmp.exp = true;
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(1);

        var keyframes = driver.log[0]['keyframeLookup'];
        expect(keyframes[0]).toEqual([0, { 'border-width': '10px' }]);
        expect(keyframes[1]).toEqual([100, { 'border-width': '100px' }]);
      })));

      it('should trigger an addClass animation based on a given className',
        inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

        var fixture = makeAnimationCmp(tcb, '<div [class.active]="exp" [class.inactive]="exp2"></div>', 'addClass(.active)', [
          style({ 'background': 'gold' }),
          animate({ 'background': 'white' }, 500)
        ]);

        var cmp = fixture.debugElement.componentInstance;
        cmp.exp = false;
        cmp.exp2 = true;
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(0);

        cmp.exp = true;
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(1);

        var keyframes = driver.log[0]['keyframeLookup'];
        expect(keyframes[0]).toEqual([0, { 'background': 'gold' }]);
        expect(keyframes[1]).toEqual([100, { 'background': 'white' }]);
      })));

      it('should trigger a removeClass animation',
        inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

        var fixture = makeAnimationCmp(tcb, '<div [class.something]="exp"></div>', 'removeClass', [
          style({ 'border-color': 'red' }),
          animate({ 'border-color': 'blue' }, 500)
        ]);

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

        expect(driver.log.length).toEqual(1);

        var keyframes = driver.log[0]['keyframeLookup'];
        expect(keyframes[0]).toEqual([0, { 'border-color': 'red' }]);
        expect(keyframes[1]).toEqual([100, { 'border-color': 'blue' }]);
      })));

      it('should trigger a removeClass animation based on a given className',
        inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

        var fixture = makeAnimationCmp(tcb, '<div [class.active]="exp" [class.inactive]="exp2"></div>', 'removeClass(.inactive)', [
          style({ 'background': 'brown' }),
          animate({ 'background': 'black' }, 500)
        ]);

        var cmp = fixture.debugElement.componentInstance;
        cmp.exp = true;
        cmp.exp2 = true;
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(0);

        cmp.exp = false;
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(0);

        cmp.exp2 = false;
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(1);

        var keyframes = driver.log[0]['keyframeLookup'];
        expect(keyframes[0]).toEqual([0, { 'background': 'brown' }]);
        expect(keyframes[1]).toEqual([100, { 'background': 'black' }]);
      })));

      it('should trigger a setAttribute animation',
        inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

        var fixture = makeAnimationCmp(tcb, '<div [attr.title]="exp"></div>', 'setAttribute', [
          style({ 'font-size': '10px' }),
          animate({ 'font-size': 0 }, 500)
        ]);

        var cmp = fixture.debugElement.componentInstance;
        cmp.exp = 'title';
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(1);

        var keyframes = driver.log[0]['keyframeLookup'];
        expect(keyframes[0]).toEqual([0, { 'font-size': '10px' }]);
        expect(keyframes[1]).toEqual([100, { 'font-size': '0px' }]);
      })));

      it('should trigger a setAttribute animation based on a given attribute name',
        inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

        var fixture = makeAnimationCmp(tcb, '<div [attr.name]="exp" [attr.title]="exp2"></div>', 'setAttribute(name)', [
          style({ 'width': '100px' }),
          animate({ 'width': 0 }, 500)
        ]);

        var cmp = fixture.debugElement.componentInstance;
        cmp.exp = null;
        cmp.exp2 = 'my-title';
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(0);

        cmp.exp = 'my-name';
        cmp.exp2 = null;
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(1);

        var keyframes = driver.log[0]['keyframeLookup'];
        expect(keyframes[0]).toEqual([0, { 'width': '100px' }]);
        expect(keyframes[1]).toEqual([100, { 'width': '0px' }]);
      })));

      it('should trigger a setAttribute animation based on a given attribute name and value',
        inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

        var fixture = makeAnimationCmp(tcb, '<div [attr.name]="exp"></div>', 'setAttribute(name=thisIsMyName)', [
          style({ 'width': '999px' }),
          animate({ 'width': 99 }, 500)
        ]);

        var cmp = fixture.debugElement.componentInstance;
        cmp.exp = 'myName';
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(0);

        cmp.exp = 'thisIsMyName';
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(1);

        var keyframes = driver.log[0]['keyframeLookup'];
        expect(keyframes[0]).toEqual([0, { 'width': '999px' }]);
        expect(keyframes[1]).toEqual([100, { 'width': '99px' }]);
      })));

      it('should trigger a setAttribute animation based on a given attribute name and quoted value',
        inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

        var fixture = makeAnimationCmp(tcb, '<div [attr.name]="exp"></div>', 'setAttribute(name="this is my value")', [
          style({ 'color': 'red' }),
          animate({ 'color': 'blue' }, 500)
        ]);

        var cmp = fixture.debugElement.componentInstance;
        cmp.exp = 'my value';
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(0);

        cmp.exp = 'this is my value';
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(1);

        var keyframes = driver.log[0]['keyframeLookup'];
        expect(keyframes[0]).toEqual([0, { 'color': 'red' }]);
        expect(keyframes[1]).toEqual([100, { 'color': 'blue' }]);
      })));

      it('should trigger a removeAttribute animation',
        inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

        var fixture = makeAnimationCmp(tcb, '<div [attr.title]="exp"></div>', 'removeAttribute', [
          style({ 'z-index': '1' }),
          animate({ 'z-index': 10 }, 500)
        ]);

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

        expect(driver.log.length).toEqual(1);

        var keyframes = driver.log[0]['keyframeLookup'];
        expect(keyframes[0]).toEqual([0, { 'z-index': '1' }]);
        expect(keyframes[1]).toEqual([100, { 'z-index': '10' }]);
      })));

      it('should trigger a removeAttribute animation based on a given attribute name',
        inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {

        var fixture = makeAnimationCmp(tcb, '<div [attr.title]="exp" [attr.name]="exp2"></div>', 'removeAttribute(title)', [
          style({ 'transform': 'scale(1)' }),
          animate({ 'transform': 'scale(2)' }, 500)
        ]);

        var cmp = fixture.debugElement.componentInstance;
        cmp.exp = 'my-title';
        cmp.exp2 = 'my-name';
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(0);

        cmp.exp2 = null;
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(0);

        cmp.exp = null;
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(1);

        var keyframes = driver.log[0]['keyframeLookup'];
        expect(keyframes[0]).toEqual([0, { 'transform': 'scale(1)' }]);
        expect(keyframes[1]).toEqual([100, { 'transform': 'scale(2)' }]);
      })));
    });

    describe('animation operations', () => {
      it('should animate the element when the expression changes',
       inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
        var fixture: ComponentFixture;
        tcb.overrideAnimations(DummyIfCmp, {
          "ngEnter": [
            style({ 'background': 'red' }),
            animate({ 'background': 'blue' }, '0.5s 1s ease-out')
          ]
        }).createAsync(DummyIfCmp).then(
            (root) => { fixture = root; });
        tick();

        var cmp = fixture.debugElement.componentInstance;
        cmp.exp = true;
        fixture.detectChanges();

        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(1);

        var animation = driver.log[0];
        expect(animation['duration']).toEqual(500);
        expect(animation['delay']).toEqual(1000);
        expect(animation['easing']).toEqual('ease-out');

        var keyframes = animation['keyframeLookup'];
        expect(keyframes[0]).toEqual([0, { 'background': 'red' }]);
        expect(keyframes[1]).toEqual([100, { 'background': 'blue' }]);
      })));

      it('should combine repeated style steps into a single step',
       inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
        var fixture: ComponentFixture;
        tcb.overrideAnimations(DummyIfCmp, {
          "ngEnter": [
            style({ 'background': 'red' }),
            style({ 'width': '100px' }),
            style({ 'background': 'gold' }),
            style({ 'height': 111 }),
            animate({ 'width': '200px', 'height':'200px', 'background':'blue' }, '999ms'),
            style({ 'opacity': '1' }),
            style({ 'border-width': '100px' }),
            animate({ 'opacity': '0', 'border-width':'10px' }, '999ms')
          ]
        }).createAsync(DummyIfCmp).then(
            (root) => { fixture = root; });
        tick();

        var cmp = fixture.debugElement.componentInstance;
        cmp.exp = true;
        fixture.detectChanges();

        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(2);

        var animation1 = driver.log[0];
        expect(animation1['duration']).toEqual(999);
        expect(animation1['delay']).toEqual(0);
        expect(animation1['easing']).toEqual(null);

        var keyframes1 = animation1['keyframeLookup'];
        expect(keyframes1[0]).toEqual(
          [0, { 'background':'gold', 'width':'100px', 'height':'111px' }]);

        expect(keyframes1[1]).toEqual(
          [100, { 'background':'blue', 'width':'200px', 'height':'200px' }]);

        var animation2 = driver.log[1];
        expect(animation2['duration']).toEqual(999);
        expect(animation2['delay']).toEqual(0);
        expect(animation2['easing']).toEqual(null);

        var keyframes2 = animation2['keyframeLookup'];
        expect(keyframes2[0]).toEqual(
          [0, { 'opacity':'1', 'border-width':'100px' }]);

        expect(keyframes2[1]).toEqual(
          [100, { 'opacity':'0', 'border-width':'10px' }]);
      })));

      it('should not perform an animations if only style steps are used',
       inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
        var fixture: ComponentFixture;
        tcb.overrideAnimations(DummyIfCmp, {
          "ngEnter": [
            style({ 'background': 'maroon' }),
            style({ 'width': '999px' }),
            style({ 'height': 666 }),
          ]
        }).createAsync(DummyIfCmp).then(
            (root) => { fixture = root; });
        tick();

        var cmp = fixture.debugElement.componentInstance;
        cmp.exp = true;
        fixture.detectChanges();

        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(0);
      })));

      describe('groups/sequences', () => {
        var assertPlaying = (player, isPlaying) => {
          var method = 'play';
          var lastEntry = player.log[player.log.length - 1];
          if (isPresent(lastEntry)) {
            if (isPlaying) {
              expect(lastEntry).toEqual(method);
            } else {
              expect(lastEntry).not.toEqual(method);
            }
          }
        }

        it('should run animations in sequence one by one if a top-level array is used',
         inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
          var fixture: ComponentFixture;
          tcb.overrideAnimations(DummyIfCmp, {
            "ngEnter": [
              style({ 'opacity': '0' }),
              animate({ 'opacity': '0.5' }, 1000),
              animate({ 'opacity': '0.8' }, '1000ms'),
              animate({ 'opacity': '1' }, '1s'),
            ]
          }).createAsync(DummyIfCmp).then(
              (root) => { fixture = root; });

          tick();

          var cmp = fixture.debugElement.componentInstance;
          cmp.exp = true;
          fixture.detectChanges();

          flushMicrotasks();
          zone.simulateMicrotaskEmpty();

          expect(driver.log.length).toEqual(3);

          var player1 = driver.log[0]['player'];
          var player2 = driver.log[1]['player'];
          var player3 = driver.log[2]['player'];

          assertPlaying(player1, true);
          assertPlaying(player2, false);
          assertPlaying(player3, false);

          player1.finish();

          assertPlaying(player1, false);
          assertPlaying(player2, true);
          assertPlaying(player3, false);

          player2.finish();

          assertPlaying(player1, false);
          assertPlaying(player2, false);
          assertPlaying(player3, true);

          player3.finish();

          assertPlaying(player1, false);
          assertPlaying(player2, false);
          assertPlaying(player3, false);
        })));

        it('should run animations in parallel if a group is used',
         inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
          var fixture: ComponentFixture;
          tcb.overrideAnimations(DummyIfCmp, {
            "ngEnter": [
              style({ 'width': 0, 'height': 0 }),
              group([
                animate({ 'width': 100 }, 1000),
                animate({ 'height': 500 }, 5000)
              ]),
              group([
                animate({ 'width': 0 }, 1000),
                animate({ 'height': 0 }, 5000)
              ])
            ]
          }).createAsync(DummyIfCmp).then(
              (root) => { fixture = root; });

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
        })));
      });

      it('should close all animation players once the animation is complete',
       inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
        var fixture: ComponentFixture;
        tcb.overrideAnimations(DummyIfCmp, {
          "ngEnter": [
            style({ 'background': 'red', 'opacity': 0.5 }),
            animate({ 'background': 'black' }, 500),
            group([
              animate({ 'background': 'black' }, 500),
              animate({ 'opacity': '0.2' }, 1000),
            ]),
            sequence([
              animate({ 'opacity': '1' }, 500),
              animate({ 'background': 'white' }, 1000)
            ])
          ]
        }).createAsync(DummyIfCmp).then(
            (root) => { fixture = root; });
        tick();

        var cmp = fixture.debugElement.componentInstance;
        cmp.exp = true;
        fixture.detectChanges();

        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        expect(driver.log.length).toEqual(5);

        driver.log.forEach(entry => entry['player'].finish());
        driver.log.forEach(entry => {
          var player = entry['player'];
          expect(player.log[player.log.length - 2]).toEqual('finish');
          expect(player.log[player.log.length - 1]).toEqual('close');
        });
      })));
    });
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
}
