import {el, describe, it, iit, xit, expect, inject, SpyObject} from 'angular2/testing_internal';
import {Component} from 'angular2/core';

export function main() {
  describe("Animation Annotations", () => {
    xit('it should test to see if the annotations are passed', () => {
      var animations = { 'something': 'abc'};
      var animationStyles = { '.else': { 'width': '100px'} };
      var cmp = new Component({
        selector: 'my-cmp',
        animations: animations,
        animationStyles: animationStyles
      });

      expect(cmp['animations']).toEqual(animations);
      expect(cmp['animationStyles']).toEqual(animationStyles);
    });
  });
}
