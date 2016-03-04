import {
  ddescribe,
  describe,
  it,
  iit,
  xit,
  expect,
  beforeEach,
  afterEach
} from 'angular2/testing_internal';

import {CssParser} from 'angular2/src/compiler/css/parser';
import {CssLookupVisitor} from 'angular2/src/compiler/css/lookup_visitor';
import {CssToken, CssLexer, CssTokenType} from 'angular2/src/compiler/css/lexer';

export function main() {

  function parseStylesheet(cssCode: string): CssLookupVisitor {
    var lexer = new CssLexer();
    var scanner = lexer.scan(cssCode);
    var parser = new CssParser(scanner);
    var ast = parser.parseStyleSheet();
    return new CssLookupVisitor(ast);
  }

  describe('CssLookupVisitor', () => {
    it('should populate a lookup instance', () => {
      var styles = `
        .selector {
          prop: something-1-2-3;
        }
      `;

      var dict = parseStylesheet(styles);
      var entries = dict.lookupRule(".selector");
      var firstBlock = entries[0]['styles'];

      expect(firstBlock['prop']).toEqual('something-1-2-3');
    });

    it('should not combine multiple instances of the same selector', () => {
      var styles = `
        .selector { val: 1; }
        .selector { val: 2; }
        .selector { val: 3; }
        .selector { val: 4; }
        .selector { val: 5; }
      `;

      var dict = parseStylesheet(styles);
      var entries = dict.lookupRule(".selector");

      expect(entries[0]['styles']['val']).toEqual('1');
      expect(entries[1]['styles']['val']).toEqual('2');
      expect(entries[2]['styles']['val']).toEqual('3');
      expect(entries[3]['styles']['val']).toEqual('4');
      expect(entries[4]['styles']['val']).toEqual('5');
    });

    it('should parse media queries', () => {
      var styles = `
        @media all and (min-height: 1000px) {
            .selector {
              prop: large-height-value;
            }
        }

        .selector {
          prop: medium-height-value
        }

        @media all and (max-height: 100px) {
            .selector {
              prop: small-height-value;
            }
        }
      `;

      var dict = parseStylesheet(styles);
      var entries = dict.lookupRule(".selector");

      var first = entries[0];
      var second = entries[1];
      var third = entries[2];

      expect(first['mediaQuery']).toEqual('all and (min-height: 1000px)');
      expect(second['mediaQuery']).toEqual('all');
      expect(third['mediaQuery']).toEqual('all and (max-height: 100px)');

      expect(first['styles']['prop']).toEqual('large-height-value');
      expect(second['styles']['prop']).toEqual('medium-height-value');
      expect(third['styles']['prop']).toEqual('small-height-value');
    });

    it('should parse keyframe styles alongside properties', () => {
      var styles = `
        @keyframes fadeInOut {
          0% { opacity:0; }
          50% { opacity:1; }
          100% { opacity:0; }
        }
      `;

      var dict = parseStylesheet(styles);
      var keyframe = dict.lookupRule('@fadeInOut')[0];

      var frames = keyframe['styles'];
      expect(frames['0%']).toEqual({'opacity': '0'});
      expect(frames['50%']).toEqual({'opacity': '1'});
      expect(frames['100%']).toEqual({'opacity': '0'});
    });

    it('should parse keyframes inside of media queries', () => {
      var styles = `
        @media print and (max-width:500px) {
          @keyframes explode {
            0% { transform:scale(0); }
            100% { transform:scale(1); }
          }
        }
        @media print and (min-width:500px) {
          @keyframes explode {
            0% { transform:scale(1); }
            100% { transform:scale(0); }
          }
        }
      `;

      var dict = parseStylesheet(styles);
      var keyframe = dict.lookupRule('@explode');

      var first = keyframe[0];
      expect(first['mediaQuery']).toEqual('print and (max-width:500px)');
      expect(first['styles']['0%']).toBeTruthy();
      expect(first['styles']['100%']['transform']).toEqual('scale(1)');

      var second = keyframe[1];
      expect(second['mediaQuery']).toEqual('print and (min-width:500px)');
      expect(second['styles']['0%']).toBeTruthy();
      expect(second['styles']['100%']['transform']).toEqual('scale(0)');
    });

    it('should throw an error if a selector is not found', () => {
      var styles = `
        .klass { }
      `;

      var dict = parseStylesheet(styles);
      expect(() => {
        var keyframe = dict.lookupRule('.class');
      }).toThrow();
    });

    it('should throw an error if simple selector is not detected', () => {
      var styles = `
        .something {
          opacity:1;
        }
        .something > .inside {
          opacity:0;
        }
      `;

      var rule, dict = parseStylesheet(styles);
      expect(() => {
        rule = dict.lookupSimpleRule(' .something ');
      }).not.toThrow();

      expect(() => {
        rule = dict.lookupRule('.something > .inside');
      }).not.toThrow();

      expect(() => {
        rule = dict.lookupSimpleRule('.something > .inside');
      }).toThrow();
    });
  });
}
