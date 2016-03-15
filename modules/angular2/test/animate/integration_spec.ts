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

import {DOM} from 'angular2/src/platform/dom/dom_adapter';
import {
  Type,
  isPresent,
  assertionsEnabled,
  isJsObject,
  global,
  stringify,
  isBlank,
  CONST,
  CONST_EXPR
} from 'angular2/src/facade/lang';
import {BaseException, WrappedException} from 'angular2/src/facade/exceptions';
import {
  PromiseWrapper,
  EventEmitter,
  ObservableWrapper,
  PromiseCompleter,
} from 'angular2/src/facade/async';

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

import {NgIf, NgFor} from 'angular2/common';

import {AsyncPipe} from 'angular2/common';

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

import {QueryList} from 'angular2/src/core/linker/query_list';

import {ViewContainerRef} from 'angular2/src/core/linker/view_container_ref';
import {EmbeddedViewRef} from 'angular2/src/core/linker/view_ref';

import {Compiler} from 'angular2/src/core/linker/compiler';
import {ElementRef} from 'angular2/src/core/linker/element_ref';
import {TemplateRef} from 'angular2/src/core/linker/template_ref';

import {Renderer} from 'angular2/src/core/render';
import {IS_DART} from 'angular2/src/facade/lang';

import {AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {style, animate} from 'angular2/src/animate/worker/animation_definition';
import {MockAnimationDriver} from 'angular2/src/mock/animation_mocks';

export function main() {
  describe('animation tests', function() {

    describe('animation triggers', () => {
      beforeEachProviders(() => [
        provide(AnimationDriver, { useClass: MockAnimationDriver })
      ]);

      iit('should animate the element when the expression changes',
       inject([TestComponentBuilder, AnimationDriver, NgZone], fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver, zone: MockNgZone) => {
        var fixture: ComponentFixture;
        tcb.createAsync(AnimationCmp).then(
            (root) => { fixture = root; });
        tick();

        zone.run(() => {
          var cmp = fixture.debugElement.componentInstance;
          cmp.exp = true;
          fixture.detectChanges();
        });
        zone.simulateZoneExit();

        flushMicrotasks();
        console.log(driver.captures);
      })));
    });
  });
}

@Component({
  styles: [`
    .visible { opacity: 0; }
    .invisible { opacity: 1; }
  `],
  animations: {
    ngEnter: [
      style({ 'background': 'red' }),
      animate({ 'background': 'blue' }, '0.5s')
    ]
  },
  template: `
    <div *ngIf="exp"></div>
  `
})
class AnimationCmp {
  exp = false;
}
