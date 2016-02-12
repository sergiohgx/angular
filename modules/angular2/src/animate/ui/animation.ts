import {PromiseWrapper} from 'angular2/src/facade/async';

export function triggerAnimation(element, animation, styles) {
  console.log('ANIMATE', element, animation, styles);
  return PromiseWrapper.resolve(true);
}
