import {bootstrap} from 'angular2/bootstrap';
import {Renderer, ElementRef, Component, Directive, Injectable} from 'angular2/core';

import {CmpOne} from './cmp_one/cmp_one';

export function main() {
  bootstrap(RelativeApp);
}

@Component({
  selector: 'relative-app',
  directives: [CmpOne],
  template: `component = <cmp-one></cmp-one>`,
  moduleId: module.id
})
export class RelativeApp {
}
