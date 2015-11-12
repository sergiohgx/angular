/*
import {AnimationContext} from '../animation_element';
import {AnimationHelper} from '../animation_helper';

export var DEFAULT_STAGGER_TIME = 100;

export class ReverseAnimationHelper implements AnimationHelper {
  private _delay: number;

  constructor({ delay }: { number? }) {
    this._delay = delay;
  }

  process(element: HTMLElement, styles: {[key: string]: string}, context: AnimationContext) {
    var relativeIndex = Array.prototype.indexOf.call(element.parentNode.children, element);
    return (total - relativeIndex) * delay;
  }
}

export class ForwardAnimationHelper implements AnimationHelper {
  private _delay: number;

  constructor({ delay }: { number? }) {
    this._delay = delay;
  }

  process(element: HTMLElement, styles: {[key: string]: string}, context: AnimationContext) {
    var relativeIndex = Array.prototype.indexOf.call(element.parentNode.children, element);
    return relativeIndex * delay;
  }
}

export class MiddleOutAnimationHelper implements AnimationHelper {
  private _delay: number;

  constructor({ delay }: { number? }) {
    this._delay = delay;
  }

  process(element: HTMLElement, styles: {[key: string]: string}, context: AnimationContext) {
    var midIndex = Math.floor(total / 2);
    var relativeIndex = Array.prototype.indexOf.call(element.parentNode.children, element);
    var diff = Math.abs(relativeIndex - midIndex);
    return diff * delay;
  }
}

export class TopDownDiagonalAnimationHelper implements AnimationHelper {
  private _delay: number;

  constructor({ delay }: { number? }) {
    this._delay = delay;
  }

  process(element: HTMLElement, styles: {[key: string]: string}, context: AnimationContext) {
    var cellWidth = element.clientWidth;
    var cellHeight = element.clientHeight;
    var leftIndex = Math.floor(element.offsetLeft / cellWidth);
    var topIndex = Math.floor(element.offsetTop / cellHeight);
    return Math.max(leftIndex, topIndex) * delay;
  }
}

export class MiddleOutDiagonalAnimationHelper implements AnimationHelper {
  private _delay: number;

  constructor({ delay }: { number? }) {
    this._delay = delay;
  }

  process(element: HTMLElement, styles: {[key: string]: string}, context: AnimationContext) {
    var container       = element.parentNode;
    var cellWidth       = element.clientWidth;
    var cellHeight      = element.clientHeight;
    var containerWidth  = container.clientWidth;
    var containerHeight = container.clientHeight;
    var leftIndex       = Math.floor(element.offsetLeft / cellWidth);
    var topIndex        = Math.floor(element.offsetTop / cellHeight);
    var rightIndex      = Math.floor((containerWidth - element.offsetLeft) / cellWidth);
    var bottomIndex     = Math.floor((containerHeight - element.offsetTop) / cellHeight);
    return Math.max(leftIndex, topIndex, rightIndex, bottomIndex) * delay;
  }
}

export class RightToLeftAnimationHelper implements AnimationHelper {
  private _delay: number;

  constructor({ delay }: { number? }) {
    this._delay = delay;
  }

  process(element: HTMLElement, styles: {[key: string]: string}, context: AnimationContext) {
    var container = element.parentNode;
    var width = container.clientWidth;
    var cellWidth = element.clientWidth;
    var rightIndex = Math.floor((width - element.offsetLeft) / cellWidth);
    return rightIndex * delay;
  }
}

export class LeftToRightAnimationHelper implements AnimationHelper {
  private _delay: number;

  constructor({ delay }: { number? }) {
    this._delay = delay;
  }

  process(element: HTMLElement, styles: {[key: string]: string}, context: AnimationContext) {
    var cellWidth = element.clientWidth;
    var leftIndex = Math.floor(element.offsetLeft / cellWidth);
    return leftIndex * delay;
  }
}

export class ZoneInAnimationHelper implements AnimationHelper {
  private _delay: number;

  constructor({ delay }: { number? }) {
    this._delay = delay;
  }

  process(element: HTMLElement, styles: {[key: string]: string}, context: AnimationContext) {
    var midIndex = Math.floor(total / 2);
    var relativeIndex = Array.prototype.indexOf.call(element.parentNode.children, element);
    var diff = Math.abs(relativeIndex - midIndex);
    return (midIndex - diff) * delay;
  }
}
*/
