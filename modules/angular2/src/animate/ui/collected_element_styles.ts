import {Set} from 'angular2/src/facade/collection';

export class CollectedElementStyles {
  properties: Set<string> = new Set<string>();

  registerStyle(prop: string) {
    this.properties.add(prop);
  }
}
