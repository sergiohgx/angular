import {AnimateApp} from './animate-app';
import {bootstrap} from 'angular2/platform/browser';
import {provide} from 'angular2/core';
import {ChangeDetectorGenConfig} from 'angular2/src/core/change_detection/interfaces';

export function main() {
  // TODO (matsko): remove once Tobias' refactor lands
  bootstrap(AnimateApp, [provide(ChangeDetectorGenConfig, { useValue: new ChangeDetectorGenConfig(true, false, false)})]);
}
