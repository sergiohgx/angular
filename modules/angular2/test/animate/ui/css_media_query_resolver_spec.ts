import {
  AsyncTestCompleter,
  beforeEach,
  beforeEachProviders,
  ddescribe,
  describe,
  el,
  expect,
  it,
  inject,
  iit,
  xit,
  TestComponentBuilder
} from 'angular2/testing_internal';

import {provide} from 'angular2/core';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {CssMediaQueryResolver} from 'angular2/src/animate/ui/css_media_query_resolver';
import {CssMatchMedia} from 'angular2/src/animate/ui/css_match_media';
import {CssDefinition} from 'angular2/src/animate/ui/css_definition';

var targetMediaQueries = ['all'];
class CustomCssMediaMatcher extends CssMatchMedia {
  match(mediaQuery: string): boolean {
    return targetMediaQueries.indexOf(mediaQuery) >= 0;
  }
}

export function main() {
  describe('CssMediaQueryResolver', () => {
    beforeEach(() => {
      targetMediaQueries = ['all'];
    });

    beforeEachProviders(() => [
      provide(CssMatchMedia, {useValue: new CustomCssMediaMatcher()})
    ]);

    it('should return the CSS merged styles that match the `all` media query',
      inject([CssMediaQueryResolver], (resolver: CssMediaQueryResolver) => {

      var defs = [
        new CssDefinition('all', { 'background': 'red' }),
        new CssDefinition('all', { 'background': 'blue', 'color': 'black' })
      ];

      var styles = resolver.resolveStyles(defs);
      expect(styles['background']).toBe('blue');
      expect(styles['color']).toBe('black');
    }));

    it('should only combined the CSS styles that match the active media queries on the document',
      inject([CssMediaQueryResolver], (resolver: CssMediaQueryResolver) => {

      targetMediaQueries = ['(min-width: 100px)', '(min-height: 100px)'];

      var defs = [
        new CssDefinition('all', { 'font-size': '200px' }),
        new CssDefinition('(min-width: 1000px)', { 'background': 'red' }),
        new CssDefinition('(min-width: 100px)', { 'background': 'gold', 'height':'100px' }),
        new CssDefinition('(min-height: 1000px)', { 'background': 'brown', 'height':'555px' }),
        new CssDefinition('(min-height: 100px)', { 'background': 'blue', 'width':'333px' }),
        new CssDefinition('all', { 'background': 'teal' })
      ];

      var styles = resolver.resolveStyles(defs);
      expect(styles['font-size']).toBe('200px');
      expect(styles['background']).toBe('teal');
      expect(styles['height']).toBe('100px');
      expect(styles['width']).toBe('333px');
    }));
  });
}
