import {AnimateApp} from './animate-app';
import {bootstrap} from 'angular2/bootstrap';
import {provide} from 'angular2/core';
import {ChangeDetectorGenConfig} from 'angular2/src/core/change_detection/interfaces';

export function main() {
  bootstrap(AnimateApp, [provide(ChangeDetectorGenConfig, { useValue: new ChangeDetectorGenConfig(true, false, false)})]);
}
