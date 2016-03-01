import {isPresent} from 'angular2/src/facade/lang';
import {Injectable} from 'angular2/core';
import {AnimationHelper} from 'angular2/src/animate/ui/animation_helper';

@Injectable()
export class AnimationHelperMap {
  private _snapshots = new Map<HTMLElement, any>();

  lookup(name: string): AnimationHelper {
    return null;
  }

  registerSnapshot(element: HTMLElement, name: string, styles: {[key: string]: any}) {
    var entry = this._snapshots.get(element);
    if (!isPresent(entry)) {
      this._snapshots.set(element, entry = {});
    }
    entry[name] = styles;
  }

  deregisterSnapshot(element: HTMLElement, name: string) {
    //TODO
  }

  lookupSnapshot(element: HTMLElement, name: string): {[key: string]: any} {
    var entry = this._snapshots.get(element);
    if (isPresent(entry) && isPresent(entry[name])) {
      return entry[name];
    }
    return null;
  }
}
