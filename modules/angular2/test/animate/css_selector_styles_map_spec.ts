import {
  AsyncTestCompleter,
  beforeEach,
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

import {StringMapWrapper} from 'angular2/src/facade/collection';
import {CssSelectorStylesMap} from 'angular2/src/animate/ui/css_selector_styles_map';

export function main() {
  ddescribe('CssSelectorStylesMap', () => {

    it('should detect simple CSS selectors', () => {
      var styles = `
        .foo {
          width:100px;
          height:100px;
        }
        .bar {
          background:red;
        }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);

      expect(map.lookup('.foo')[0].styles).toEqual({
        'width': '100px',
        'height': '100px'
      });

      expect(map.lookup('.bar')[0].styles).toEqual({
        'background': 'red'
      });
    });

    it('should detect grouped simple CSS selectors', () => {
      var styles = `
        .foo, .bar, .baz {
          border:10px solid red;
        }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);

      ['.foo', '.bar', '.baz'].forEach((klass) => {
        expect(map.lookup(klass)[0].styles).toEqual({
          'border': '10px solid red'
        });
      });
    });

    it('should detect keyframe selectors', () => {
      var styles = `
        @-webkit-keyframes rotateOut {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(180deg); }
        }
        @keyframes rotateOut {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(180deg); }
        }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);

      expect(map.lookup('@rotateOut')[0].styles).toEqual({
        '0%': {
          'transform':'rotate(0deg)'
        },
        '100%': {
          'transform':'rotate(180deg)'
        }
      });
    });

    it('should alias `from` and `to` as `0%` and `100%` for keyframe selectors', () => {
      var styles = `
        @-webkit-keyframes bgChange {
          from { background:blue; }
          to { background:red; }
        }
        @keyframes bgChange {
          from { background:blue; }
          to { background:red; }
        }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);

      expect(map.lookup('@bgChange')[0].styles).toEqual({
        '0%': {
          'background':'blue'
        },
        '100%': {
          'background':'red'
        }
      });
    });

    it('should throw an error when a CSS class or keyframe is not detected', () => {
      var styles = `
        .matias { background:blue; }
        @keyframe matias {
          from { background: blue; }
          to { background: red; }
        }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);

      expect(() => {
        map.lookup('.mathias');
      }).toThrowError('The CSS class ".mathias" was not found among the provided styles');

      expect(() => {
        map.lookup('@mathias');
      }).toThrowError('The CSS keyframe "@mathias" was not found among the provided styles');
    });

    it('should not register selectors that cross element boundaries', () => {
      var styles = `
        .container > .child { background:red; }
        .container + .child { background:blue; }
        .container ~ .child { background:orange; }
        .container .child { background:red; }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);

      ['.container > .child',
       '.container + .child',
       '.container ~ .child',
       '.container .child']
        .forEach((selector) => {
          expect(() => {
            map.lookup(selector);
          }).toThrowError();
        });
    });

    it('should bundle styles all/media styles together when media queries are used', () => {
      var styles = `
        .my-rule {
          background:black;
          color:white;
        }

        @media screen and (max-width: 100px) {
          .my-rule {
            background:red;
            color:orange;
          }
        }

        @media screen and (min-width: 100px) {
          .my-rule {
            background:blue;
            color:pink;
          }
        }

        .my-rule {
          background:yellow;
          color:blue;
        }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);
      var results = map.lookup('.my-rule');

      var result0 = results[0];
      expect(result0.mediaQuery).toBe('all');
      expect(result0.styles).toEqual({
        'background':'yellow',
        'color':'blue'
      });

      var result1 = results[1];
      expect(result1.mediaQuery).toBe('screen and (max-width: 100px)');
      expect(result1.styles).toEqual({
        'background':'red',
        'color':'orange'
      });

      var result2 = results[2];
      expect(result2.mediaQuery).toBe('screen and (min-width: 100px)');
      expect(result2.styles).toEqual({
        'background':'blue',
        'color':'pink'
      });
    });

    it('should combine repeated declarations of classes together within the same mediaQuery', () => {
      var styles = `
        .huge { width:1000px; }
        .huge { height:1000px; }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);

      var results = map.lookup('.huge');
      expect(results[0].styles).toEqual({
        'width':'1000px',
        'height':'1000px'
      });
    });

    it('should only register the last, same-named keyframe', () => {
      var styles = `
        @-webkit-keyframes huge {
          0% { width:0; }
          100% { width:1000px; }
        }
        @keyframes huge {
          0% { width:0; }
          100% { width:1000px; }
        }
        @-webkit-keyframes huge {
          0% { height:0; }
          100% { height:1000px; }
        }
        @keyframes huge {
          0% { height:0; }
          100% { height:1000px; }
        }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);

      expect(map.lookup('@huge')[0].styles).toEqual({
        '0%': {
          'height':'0px'
        },
        '100%': {
          'height':'1000px'
        }
      });
    });

    it('should not register non-animation classes or keyframe selectors', () => {
      var styles = `
        some-tag {
          background:red;
        }
        @media screen and (min-width: 100px) {
          some-tag {
            background:blue;
          }
        }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);
      expect(() => {
        map.lookup('some-tag');
      }).toThrowError();
    });

    it('should not register selectors that contain no styles', () => {
      var styles = `
        .some-class { }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);
      expect(() => {
        map.lookup('.some-class');
      }).toThrowError();
    });

    it('should not register media queries that contain empty animation-selectors ', () => {
      var styles = `
        @media screen and (max-width: 100px) {
          .some-animation {}
        }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);
      expect(() => {
        map.lookup('.some-animation');
      }).toThrowError();
    });

    it('should not apply media queries that contain empty animation-selectors to valid animation classes', () => {
      var styles = `
        .some-animation { background:red; }
        @media screen and (max-width: 100px) {
          .some-animation {}
        }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);
      var results = map.lookup('.some-animation');
      expect(results.length).toBe(1);
    });

    it('should allow for multiple versions of keyframes with media queries to be defined', () => {
      var styles = `
        @media screen and (min-width: 100px) {
          @-webkit-keyframes slideToVisible {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(0%); }
          }
          @keyframes slideToVisible {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(0%); }
          }
        }
        @media screen and (max-width: 100px) {
          @-webkit-keyframes slideToVisible {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(0%); }
          }
          @keyframes slideToVisible {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(0%); }
          }
        }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);
      var results = map.lookup('@slideToVisible');

      var result0 = results[0];
      expect(result0.mediaQuery).toBe('screen and (min-width: 100px)');
      expect(result0.styles).toEqual({
        '0%': {
          'transform':'translateY(-100%)'
        },
        '100%': {
          'transform':'translateY(0%)'
        }
      });

      var result1 = results[1];
      expect(result1.mediaQuery).toBe('screen and (max-width: 100px)');
      expect(result1.styles).toEqual({
        '0%': {
          'transform':'translateX(-100%)'
        },
        '100%': {
          'transform':'translateX(0%)'
        }
      });
    });

    it('should extract the duration and delay value when a shorthand transition value exists within the styles', () => {
      var styles = `
        .transition-this {
          background:red;
          transition:1s linear all 2s;
        }
      `;

      var map = CssSelectorStylesMap.fromStyles(styles);
      expect(map.lookup('.transition-this')[0].styles).toEqual({
        'background':'red',
        'easing': 'linear',
        'duration':'1s',
        'delay':'2s'
      });
    });
  });
}
