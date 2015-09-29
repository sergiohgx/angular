import {AnimatorDispatch} from '../animator_dispatch';

import {DOM} from 'angular2/src/core/dom/dom_adapter';
import {ListWrapper, MapWrapper, Map, StringMapWrapper, StringMap} from 'angular2/src/core/facade/collection';
import {isPresent, isBlank, stringify} from 'angular2/src/core/facade/lang';

import {DomProtoView} from './proto_view';

import {RenderViewRef, RenderEventDispatcher} from '../../api';
import {camelCaseToDashCase} from '../util';

export function resolveInternalDomView(viewRef: RenderViewRef): DomView {
  return (<DomViewRef>viewRef)._view;
}

export class DomViewRef extends RenderViewRef {
  constructor(public _view: DomView) { super(); }
}

/**
 * Const of making objects: http://jsperf.com/instantiate-size-of-object
 */
export class DomView {
  hydrated: boolean = false;
  eventDispatcher: RenderEventDispatcher = null;
  eventHandlerRemovers: Function[] = [];

  constructor(public proto: DomProtoView, public boundTextNodes: Node[],
              public boundElements: Element[],
              private _animator: AnimatorDispatch) {}

  _dispatchEvent(node, event, data = {}, callback = null) {
    this._animator.queue(node, event, data, callback);
  }

  _onAttributeOrPropertyChange(element, attr, value) {
    this._dispatchEvent(element, "attributeChange", { attr: attr, value: value });
  }

  setElementProperty(elementIndex: number, propertyName: string, value: any) {
    var element = this.boundElements[elementIndex];
    DOM.setProperty(element, propertyName, value);
    this._onAttributeOrPropertyChange(element, propertyName, value);
  }

  setElementAttribute(elementIndex: number, attributeName: string, value: string) {
    var element = this.boundElements[elementIndex];
    var dashCasedAttributeName = camelCaseToDashCase(attributeName);
    if (isPresent(value)) {
      DOM.setAttribute(element, dashCasedAttributeName, stringify(value));
    } else {
      DOM.removeAttribute(element, dashCasedAttributeName);
    }
    this._onAttributeOrPropertyChange(element, attributeName, value);
  }

  setElementClass(elementIndex: number, className: string, isAdd: boolean) {
    var element = this.boundElements[elementIndex];
    if (isAdd) {
      DOM.addClass(element, className);
    } else {
      DOM.removeClass(element, className);
    }
    this._dispatchEvent(element, isAdd ? "addClass" : "removeClass", { className: className });
  }

  setElementStyle(elementIndex: number, styleName: string, value: string) {
    var element = this.boundElements[elementIndex];
    var dashCasedStyleName = camelCaseToDashCase(styleName);
    if (isPresent(value)) {
      DOM.setStyle(element, dashCasedStyleName, stringify(value));
    } else {
      DOM.removeStyle(element, dashCasedStyleName);
    }
  }

  triggerCustomDomEvent(elementIndex: number, eventName: string, eventOptions: StringMap<string, any>): void {
    var event = new CustomEvent(eventName, eventOptions);
    var element = this.boundElements[elementIndex];
    element.dispatchEvent(event);
  }

  invokeElementMethod(elementIndex: number, methodName: string, args: any[]) {
    var element = this.boundElements[elementIndex];
    DOM.invoke(element, methodName, args);
  }

  setText(textIndex: number, value: string) { DOM.setText(this.boundTextNodes[textIndex], value); }

  dispatchEvent(elementIndex: number, eventName: string, event: Event): boolean {
    var allowDefaultBehavior = true;
    if (isPresent(this.eventDispatcher)) {
      var evalLocals = new Map();
      evalLocals.set('$event', event);
      // TODO(tbosch): reenable this when we are parsing element properties
      // out of action expressions
      // var localValues = this.proto.elementBinders[elementIndex].eventLocals.eval(null, new
      // Locals(null, evalLocals));
      // this.eventDispatcher.dispatchEvent(elementIndex, eventName, localValues);
      allowDefaultBehavior =
          this.eventDispatcher.dispatchRenderEvent(elementIndex, eventName, evalLocals);
      if (!allowDefaultBehavior) {
        DOM.preventDefault(event);
      }
    }
    return allowDefaultBehavior;
  }
}
