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

import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {MockAnimationDriver, MockAnimationPlayer} from 'angular2/src/mock/animation/animation_driver';
import {style, animate, group} from 'angular2/animate';

export function main() {
  ddescribe('animation tests', function() {
    beforeEachProviders(() => [
      provide(AnimationDriver, { useClass: MockAnimationDriver }),
      provide(ChangeDetectorGenConfig, { useValue: new ChangeDetectorGenConfig(true, false, false)})
    ]);

    var makeAnimationCmp = (tcb: TestComponentBuilder, tpl: string, method: string, animation: {[key: string]: any[]}) => {
      var animations = {};
      if (!isPresent(animations[method])) {
        animations[method] = animation;
      }

      var fixture: ComponentFixture;
      tcb = tcb.overrideTemplate(IfCmp, tpl);
      tcb = tcb.overrideAnimations(IfCmp, animations);
      tcb.createAsync(IfCmp).then((root) => {
        fixture = root;
      });

      tick();
      return fixture;
    };

    var assertPropertyAnimated = (stylesList, property) => {
      var status = false;
      var previousValue = stylesList[0][property];
      for (var i = 1; i < stylesList.length; i++) {
        let value = stylesList[i][property];
        if (value != previousValue) {
          status = true;
          break;
        }
      }
      expect(status).toBe(true);
    };

    describe('animation triggers', () => {
      iit('should trigger onEnter',
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

        var keyframes = driver.log.map(entry => entry['keyframeStyles'])
        assertPropertyAnimated(keyframes, 'opacity');
      })));

      /*
      it('should trigger onLeave',
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

        var cmp = fixture.debugElement.componentInstance;
        cmp.exp = false;
        fixture.detectChanges();
        flushMicrotasks();
        zone.simulateMicrotaskEmpty();

        var keyframes = driver.log.map(entry => entry['keyframeStyles'])
        assertPropertyAnimated(keyframes, 'width');
      })));
     */
    });

    /*
    describe('animation operations', () => {
      it('should animate the element when the expression changes',
       inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
        var fixture: ComponentFixture;
        tcb.overrideAnimations(IfCmp, {
          ngEnter: [
            style({ 'background': 'red' }),
            animate({ 'background': 'blue' }, '0.5s 1s ease-out')
          ]
        }).createAsync(IfCmp).then(
            (root) => { fixture = root; });
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
        expect(animation1['keyframeStyles']).toEqual({ 'background':'red' });

        var animation2 = driver.log[1];
        expect(animation2['duration']).toEqual(500);
        expect(animation2['delay']).toEqual(1000);
        expect(animation2['easing']).toEqual('ease-out');
        expect(animation2['keyframeStyles']).toEqual({ 'background':'blue' });
      })));

      it('should combine repeated style steps into a single step',
       inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
        var fixture: ComponentFixture;
        tcb.overrideAnimations(IfCmp, {
          ngEnter: [
            style({ 'background': 'red' }),
            style({ 'width': '100px' }),
            style({ 'background': 'gold' }),
            style({ 'height': 111 }),
            animate({ 'width': '200px', 'height':'200px', 'background':'blue' }, '999ms'),
            style({ 'opacity': '1' }),
            style({ 'border-width': '100px' }),
            animate({ 'opacity': '0', 'border-width':'10px' }, '999ms')
          ]
        }).createAsync(IfCmp).then(
            (root) => { fixture = root; });
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
        expect(animation1['keyframeStyles']).toEqual({ 'background':'gold', 'width':'100px', 'height':'111px' });

        var animation2 = driver.log[1];
        expect(animation2['duration']).toEqual(999);

        var animation3 = driver.log[2];
        expect(animation3['duration']).toEqual(0);
        expect(animation3['delay']).toEqual(0);
        expect(animation3['easing']).toEqual(null);
        expect(animation3['keyframeStyles']).toEqual({ 'opacity':'1', 'border-width':'100px' });
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
          tcb.overrideAnimations(IfCmp, {
            ngEnter: [
              style({ 'opacity': '0' }),
              animate({ 'opacity': '0.5' }, 1000),
              animate({ 'opacity': '0.8' }, '1000ms'),
              animate({ 'opacity': '1' }, '1s'),
            ]
          }).createAsync(IfCmp).then(
              (root) => { fixture = root; });

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
        })));

        it('should run animations in parallel if a group is used',
         inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
          var fixture: ComponentFixture;
          tcb.overrideAnimations(IfCmp, {
            ngEnter: [
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
          }).createAsync(IfCmp).then(
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
    });
     */
  });
}

@Component({
  selector: 'if-cmp',
  template: `
    <div *ngIf="exp"></div>
  `
})
class IfCmp {
  exp = false;
}
