import {IS_DART, isString, isPresent} from 'angular2/src/facade/lang';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';

export var ONE_SECOND = 1000;
export var ONE_HUNDRED_PERCENT = 1;
export var SAFE_FAST_FORWARD_VALUE = '-9999';

export function removeEventListener(element: HTMLElement, eventName: string, listener = null): void {
  if (IS_DART) {
    // TODO
  } else {
    element.removeEventListener(eventName, listener);
  }
}

export function prepareTestElement(): HTMLElement {
  var elm = document.createElement('div');
  document.body.appendChild(elm);
  return elm;
}

export function base16(dec: number): string {
  var hex = dec.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export function isObject(value: any): boolean {
  // yes I know this sucks
  return !isString(value);
}

export function removeOrRestoreCssStyles(element: HTMLElement, styles: {[key: string]: string}): void {
  StringMapWrapper.forEach(styles, (value, style) => {
    if (isPresent(value) && value.length) {
      DOM.setStyle(element, style, value);
    } else {
      DOM.removeStyle(element, style);
    }
  });
}

export function applyCssStyles(element: HTMLElement, styles: {[key: string]: string}): void {
  for (var prop in styles) {
    element.style.setProperty(prop, styles[prop]);
  }
}

export function copy(obj) {
  var newObj = {};
  StringMapWrapper.forEach(obj, (value, key) => {
    newObj[key] = value;
  });
  return newObj;
}

export function pickStyles(element: HTMLElement, props: string[]): {[key: string]: string} {
  var gcs = window.getComputedStyle(element);
  var data: {[key: string]: string} = {};
  props.forEach((prop: string) => {
    data[prop] = <string>gcs[prop];
  });
  return data;
}

export function triggerReflow(elm: HTMLElement = null): number {
  return (elm || document.body).clientWidth + 1;
}

export function parseTime(str: string): number {
  var value = null;
  if (str && str.length) {
    if (str[str.length - 1] == 's') {
      str = str.substring(0, str.length - 1);
    }
    if (str[str.length - 1] == 'm') {
      value = parseInt(str.substring(0, str.length - 1));
    } else {
      value = parseFloat(str) * ONE_SECOND;
    }
  }
  return value;
}

export function parseMaxTime(str: string): number {
  return str.split(/\s*,\s*/g).reduce((max, value) => {
    // it's always safe to consider only second values and omit `ms` values since
    // getComputedStyle will always handle the conversion for us
    if (value.charAt(value.length - 1) == 's') {
      value = value.substring(0, value.length - 1);
    }
    var intVal: number = parseFloat(value) || 0;
    intVal = max ? Math.max(intVal, max) : intVal;
    return intVal;
  }, 0);
}

export function insertAfter(newNode: HTMLElement, refNode: HTMLElement): void {
  var parent = refNode.parentNode;
  if (parent.childNodes.length > 1) {
    parent.insertBefore(newNode, refNode.nextSibling);
  } else {
    parent.appendChild(newNode);
  }
}

export function isEmpty(value: any): boolean {
  return value == null;
}
