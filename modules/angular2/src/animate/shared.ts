import {Set} from 'angular2/src/facade/collection';
import {IS_DART, isString, isPresent, RegExpWrapper, NumberWrapper} from 'angular2/src/facade/lang';
import {StringMapWrapper} from 'angular2/src/facade/collection';

export function appendSet(a: Set<any>, b: Set<any>) {
  if (isPresent(b)) {
    b.forEach((val) => {
      a.add(val);
    });
  }
}

export function parseTimeExpression(exp: string|number): any[] {
  var duration: number = null;
  var delay: number = null;
  var easing: string = null;
  if (isString(exp)) {
    var values = (<string>exp).split(' ');
    var i = 0;

    if (isPresent(values[i])) {
      duration = parseTime(values[i++]);
    }

    // this means that the delay number value was detected
    var next = values.length > 1 ? values[i] : null;
    if (next != null && RegExpWrapper.test(/[0-9]/, next[0])) {
      i++;
      delay = parseTime(next);
    }

    if (isPresent(values[i])) {
      easing = values[i];
    }
  } else {
    duration = <number>exp;
  }

  return [duration, delay, easing];
}

export function parseTime(time:string): number {
  var value = 0;
  var modifier = 1;
  if (isPresent(time) && time.length > 0) {
    var lastChar = time[time.length - 1];
    var chop = 0;
    if (lastChar == 's') {
      chop++;
      var secondLastChar = time[time.length - 2];
      if (secondLastChar == 'm') {
        chop++;
      } else {
        modifier = ONE_SECOND;
      }
    }
    value = NumberWrapper.parseFloat(time.substring(0, time.length - chop)) * modifier;
  }
  return value;
}

export var ONE_SECOND = 1000;

export function removeEventListener(element: HTMLElement, eventName: string, listener = null): void {
  if (IS_DART) {
    // TODO
  } else {
    element.removeEventListener(eventName, listener);
  }
}

export function copy(obj) {
  var newObj = {};
  StringMapWrapper.forEach(obj, (value, key) => {
    newObj[key] = value;
  });
  return newObj;
}
