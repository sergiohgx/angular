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

import {
  CssParser,
  BlockType,
  CssSelectorRuleAST,
  CssKeyframeRuleAST,
  CssBlockDefinitionRuleAST,
  CssMediaQueryRuleAST,
  CssBlockRuleAST,
  CssInlineRuleAST,
  CssStyleValueAST,
  CssSelectorAST,
  CssDefinitionAST,
  CssStyleSheetAST,
  CssRuleAST,
  CssBlockAST
} from 'angular2/src/compiler/css/parser';

import {CssLexer} from 'angular2/src/compiler/css/lexer';

export function main() {
  describe('CssParser', () => {
    function makeAST(css) {
      var lexer = new CssLexer();
      var scanner = lexer.scan(css);
      var parser = new CssParser(scanner);
      return parser.parseStyleSheet();
    }

    it('should parse CSS into a stylesheet AST', () => {
      var styles = `
        .selector {
          prop: value123;
        }
      `;

      var ast = makeAST(styles);
      expect(ast.rules.length).toEqual(1);

      var rule = <CssSelectorRuleAST>ast.rules[0];
      var selector = rule.selectors[0];
      expect(selector.strValue).toEqual('.selector');

      var block: CssBlockAST = rule.block;
      expect(block.entries.length).toEqual(1);

      var definition = <CssDefinitionAST>block.entries[0];
      expect(definition.property.strValue).toEqual('prop');

      var value = <CssStyleValueAST>definition.value;
      expect(value.strValue).toEqual('value123');
    });

    it('should parse keyframe rules', () => {
      var styles = `
        @keyframes rotateMe {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `;

      var ast = makeAST(styles);
      expect(ast.rules.length).toEqual(1);

      var rule = <CssKeyframeRuleAST>ast.rules[0];
      expect(rule.name.strValue).toEqual('rotateMe');

      var block = <CssBlockAST>rule.block;
      var fromRule = <CssSelectorRuleAST>block.entries[0];

      expect(fromRule.selectors[0].strValue).toEqual('from');
      var fromStyle = <CssDefinitionAST>(<CssBlockAST>fromRule.block).entries[0];
      expect(fromStyle.property.strValue).toEqual('transform');
      expect(fromStyle.value.strValue).toEqual('rotate(0deg)');

      var toRule = <CssSelectorRuleAST>block.entries[1];

      expect(toRule.selectors[0].strValue).toEqual('to');
      var toStyle = <CssDefinitionAST>(<CssBlockAST>toRule.block).entries[0];
      expect(toStyle.property.strValue).toEqual('transform');
      expect(toStyle.value.strValue).toEqual('rotate(360deg)');
    });

    it('should parse media queries into a stylesheet AST', () => {
      var styles = `
        @media all and (max-width:100px) {
          .selector {
            prop: value123;
          }
        }
      `;

      var ast = makeAST(styles);
      expect(ast.rules.length).toEqual(1);

      var rule = <CssMediaQueryRuleAST>ast.rules[0];
      expect(rule.name.strValue).toEqual('all and (max-width:100px)');

      var block = <CssBlockAST>rule.block;
      expect(block.entries.length).toEqual(1);

      var rule2 = <CssSelectorRuleAST>block.entries[0];
      expect(rule2.selectors[0].strValue).toEqual('.selector');

      var block2 = <CssBlockAST>rule2.block;
      expect(block2.entries.length).toEqual(1);
    });

    it('should parse inline CSS values', () => {
      var styles = `
        @import url('remote.css');
        @charset "UTF-8";
        @namespace ng url(http://angular.io/namespace/ng);
      `;

      var ast = makeAST(styles);

      var importRule = <CssInlineRuleAST>ast.rules[0];
      expect(importRule.type).toEqual(BlockType.Import);
      expect(importRule.value.strValue).toEqual("url('remote.css')");

      var charsetRule = <CssInlineRuleAST>ast.rules[1];
      expect(charsetRule.type).toEqual(BlockType.Charset);
      expect(charsetRule.value.strValue).toEqual('"UTF-8"');

      var namespaceRule = <CssInlineRuleAST>ast.rules[2];
      expect(namespaceRule.type).toEqual(BlockType.Namespace);
      expect(namespaceRule.value.strValue).toEqual("ng url(http://angular.io/namespace/ng)");
    });

    it('should parse un-named block-level CSS values', () => {
      var styles = `
        @font-face {
          font-family: "Matias";
          font-weight: bold;
          src: url(font-face.ttf);
        }
        @viewport {
          max-width: 100px;
          min-height: 1000px;
        }
      `;

      var ast = makeAST(styles);

      var fontFaceRule = <CssBlockRuleAST>ast.rules[0];
      expect(fontFaceRule.type).toEqual(BlockType.FontFace);
      expect(fontFaceRule.block.entries.length).toEqual(3);

      var viewportRule = <CssBlockRuleAST>ast.rules[1];
      expect(viewportRule.type).toEqual(BlockType.Viewport);
      expect(viewportRule.block.entries.length).toEqual(2);
    });

    it('should parse multiple levels of semicolons', () => {
      var styles = `
        ;;;
        @import url('something something')
        ;;;;;;;;
        ;;;;;;;;
        ;@font-face {
          ;src   :   url(font-face.ttf);;;;;;;;
          ;;;-webkit-animation:my-animation
        };;;
        @media all and (max-width:100px)
        {;
          .selector {prop: value123;};
          ;.selector2{prop:1}}
      `;

      var ast = makeAST(styles);

      var importRule = <CssInlineRuleAST>ast.rules[0];
      expect(importRule.type).toEqual(BlockType.Import);
      expect(importRule.value.strValue).toEqual("url('something something')");

      var fontFaceRule = <CssBlockRuleAST>ast.rules[1];
      expect(fontFaceRule.type).toEqual(BlockType.FontFace);
      expect(fontFaceRule.block.entries.length).toEqual(2);

      var mediaQueryRule = <CssMediaQueryRuleAST>ast.rules[2];
      expect(mediaQueryRule.name.strValue).toEqual('all and (max-width:100px)');
      expect(mediaQueryRule.block.entries.length).toEqual(2);
    });

    it('should throw an error if an unknown @value block rule is parsed', () => {
      var styles = `
        @matias { hello: there; }
      `;

      expect(() => { makeAST(styles); }).toThrowError();
    });

    it('should parse empty rules', () => {
      var styles = `
        .empty-rule { }
        .somewhat-empty-rule { /* property: value; */ }
        .non-empty-rule { property: value; }
      `;

      var ast = makeAST(styles);

      var rules = ast.rules;
      expect((<CssSelectorRuleAST>rules[0]).block.entries.length).toEqual(0);
      expect((<CssSelectorRuleAST>rules[1]).block.entries.length).toEqual(0);
      expect((<CssSelectorRuleAST>rules[2]).block.entries.length).toEqual(1);
    });

    it('should parse the @document rule', () => {
      var styles = `
        @document url(http://www.w3.org/),
                       url-prefix(http://www.w3.org/Style/),
                       domain(mozilla.org),
                       regexp("https:.*")
        {
          /* CSS rules here apply to:
             - The page "http://www.w3.org/".
             - Any page whose URL begins with "http://www.w3.org/Style/"
             - Any page whose URL's host is "mozilla.org" or ends with
               ".mozilla.org"
             - Any page whose URL starts with "https:" */

          /* make the above-mentioned pages really ugly */
          body {
            color: purple;
            background: yellow;
          }
        }
      `;

      var ast = makeAST(styles);

      var rules = ast.rules;
      var documentRule = <CssBlockDefinitionRuleAST>rules[0];
      expect(documentRule.type).toEqual(BlockType.Document);
      expect(documentRule.strValue).toEqual(`url(http://www.w3.org/),
                       url-prefix(http://www.w3.org/Style/),
                       domain(mozilla.org),
                       regexp("https:.*")`);

      var rule = <CssSelectorRuleAST>documentRule.block.entries[0];
      expect(rule.strValue).toEqual("body");
    });

    it('should parse the @page rule', () => {
      var styles = `
        @page one {
          .selector { prop: value; }
        }
        @page two {
          .selector2 { prop: value2; }
        }
      `;

      var ast = makeAST(styles);

      var rules = ast.rules;

      var pageRule1 = <CssBlockDefinitionRuleAST>rules[0];
      expect(pageRule1.strValue).toEqual("one");
      expect(pageRule1.type).toEqual(BlockType.Page);

      var pageRule2 = <CssBlockDefinitionRuleAST>rules[1];
      expect(pageRule2.strValue).toEqual("two");
      expect(pageRule2.type).toEqual(BlockType.Page);

      var selectorOne = <CssSelectorRuleAST>pageRule1.block.entries[0];
      expect(selectorOne.strValue).toEqual('.selector');

      var selectorTwo = <CssSelectorRuleAST>pageRule2.block.entries[0];
      expect(selectorTwo.strValue).toEqual('.selector2');
    });

    it('should parse the @supports rule', () => {
      var styles = `
        @supports (animation-name: "rotate") {
          a:hover { animation: rotate 1s; }
        }
      `;

      var ast = makeAST(styles);

      var rules = ast.rules;

      var supportsRule = <CssBlockDefinitionRuleAST>rules[0];
      expect(supportsRule.strValue).toEqual('(animation-name: "rotate")');
      expect(supportsRule.type).toEqual(BlockType.Supports);

      var selectorOne = <CssSelectorRuleAST>supportsRule.block.entries[0];
      expect(selectorOne.strValue).toEqual('a:hover');
    });
  });
}
