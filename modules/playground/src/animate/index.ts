import {AnimateApp} from './animate-app';
import {bootstrap} from 'angular2/platform/browser';
import {provide} from 'angular2/core';

export function main() {
  bootstrap(AnimateApp, []);
}
