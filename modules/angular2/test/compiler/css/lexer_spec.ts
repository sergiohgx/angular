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

import {CssToken, CssLexer, CssTokenType} from 'angular2/src/compiler/css/lexer';

export function main() {
  function tokenize(code, trackComments: boolean = false): CssToken[] {
    var scanner = new CssLexer().scan(code, trackComments);
    var tokens = [];
    var token = scanner.scan();

    while (token != null) {
      tokens.push(token);
      token = scanner.scan();
    }

    return tokens;
  }

  describe('CssLexer', () => {
    it('should lex newline characters as whitespace', () => {
      var newlines = ["\n", "\r\n", "\r", "\f"];
      newlines.forEach((line) => {
        var token = tokenize(line)[0];
        expect(token.type).toEqual(CssTokenType.Whitespace);
      });
    });

    it('should combined newline characters as one newline token', () => {
      var newlines = ["\n", "\r\n", "\r", "\f"].join("");
      var tokens = tokenize(newlines);
      expect(tokens.length).toEqual(1);
      expect(tokens[0].type).toEqual(CssTokenType.Whitespace);
    });

    it('should lex simple selectors and their inner properties', () => {
      var cssCode = "\n" + "  .selector { my-prop: my-value; }\n";
      var tokens = tokenize(cssCode);

      expect(tokens[0].type).toEqual(CssTokenType.Whitespace);

      expect(tokens[1].type).toEqual(CssTokenType.Character);
      expect(tokens[1].strValue).toEqual('.');

      expect(tokens[2].type).toEqual(CssTokenType.Identifier);
      expect(tokens[2].strValue).toEqual('selector');

      expect(tokens[3].type).toEqual(CssTokenType.Whitespace);
      expect(tokens[3].strValue).toEqual(' ');

      expect(tokens[4].type).toEqual(CssTokenType.Character);
      expect(tokens[4].strValue).toEqual('{');

      expect(tokens[5].type).toEqual(CssTokenType.Whitespace);
      expect(tokens[5].strValue).toEqual(' ');

      expect(tokens[6].type).toEqual(CssTokenType.Identifier);
      expect(tokens[6].strValue).toEqual('my-prop');

      expect(tokens[7].type).toEqual(CssTokenType.Character);
      expect(tokens[7].strValue).toEqual(':');

      expect(tokens[8].type).toEqual(CssTokenType.Whitespace);
      expect(tokens[8].strValue).toEqual(' ');

      expect(tokens[9].type).toEqual(CssTokenType.Identifier);
      expect(tokens[9].strValue).toEqual('my-value');

      expect(tokens[10].type).toEqual(CssTokenType.Character);
      expect(tokens[10].strValue).toEqual(';');

      expect(tokens[11].type).toEqual(CssTokenType.Whitespace);
      expect(tokens[11].strValue).toEqual(' ');

      expect(tokens[12].type).toEqual(CssTokenType.Character);
      expect(tokens[12].strValue).toEqual('}');
    });

    it('should capture the column and line values for each token', () => {
      var cssCode = "#id {\n" + "  prop:value;\n" + "}";

      var tokens = tokenize(cssCode);

      // #
      expect(tokens[0].type).toEqual(CssTokenType.Character);
      expect(tokens[0].column).toEqual(0);
      expect(tokens[0].line).toEqual(0);

      // id
      expect(tokens[1].type).toEqual(CssTokenType.Identifier);
      expect(tokens[1].column).toEqual(1);
      expect(tokens[1].line).toEqual(0);

      // ' '
      expect(tokens[2].type).toEqual(CssTokenType.Whitespace);
      expect(tokens[2].column).toEqual(3);
      expect(tokens[2].line).toEqual(0);

      // {
      expect(tokens[3].type).toEqual(CssTokenType.Character);
      expect(tokens[3].column).toEqual(4);
      expect(tokens[3].line).toEqual(0);

      // '\n '
      expect(tokens[4].type).toEqual(CssTokenType.Whitespace);
      expect(tokens[4].column).toEqual(5);
      expect(tokens[4].line).toEqual(0);

      // prop
      expect(tokens[5].type).toEqual(CssTokenType.Identifier);
      expect(tokens[5].column).toEqual(2);
      expect(tokens[5].line).toEqual(1);

      // :
      expect(tokens[6].type).toEqual(CssTokenType.Character);
      expect(tokens[6].column).toEqual(6);
      expect(tokens[6].line).toEqual(1);

      // value
      expect(tokens[7].type).toEqual(CssTokenType.Identifier);
      expect(tokens[7].column).toEqual(7);
      expect(tokens[7].line).toEqual(1);

      // ;
      expect(tokens[8].type).toEqual(CssTokenType.Character);
      expect(tokens[8].column).toEqual(12);
      expect(tokens[8].line).toEqual(1);

      // \n
      expect(tokens[9].type).toEqual(CssTokenType.Whitespace);
      expect(tokens[9].column).toEqual(13);
      expect(tokens[9].line).toEqual(1);

      // }
      expect(tokens[10].type).toEqual(CssTokenType.Character);
      expect(tokens[10].column).toEqual(0);
      expect(tokens[10].line).toEqual(2);
    });

    it('should lex quoted strings and escape accordingly', () => {
      var cssCode = "prop: 'some { value } \\' that is quoted'";
      var tokens = tokenize(cssCode);

      expect(tokens[0].type).toEqual(CssTokenType.Identifier);
      expect(tokens[1].type).toEqual(CssTokenType.Character);
      expect(tokens[2].type).toEqual(CssTokenType.Whitespace);
      expect(tokens[3].type).toEqual(CssTokenType.String);
      expect(tokens[3].strValue).toEqual("'some { value } \\' that is quoted'");
    });

    it('should treat attribute operators as regular characters', () => {
      tokenize('^|~+*').forEach((token) => { expect(token.type).toEqual(CssTokenType.Character); });
    });

    it('should lex numbers properly and set them as numbers', () => {
      var cssCode = "0 1 -2 3.0 -4.001";
      var tokens = tokenize(cssCode);

      expect(tokens[0].type).toEqual(CssTokenType.Number);
      expect(tokens[0].strValue).toEqual("0");

      expect(tokens[2].type).toEqual(CssTokenType.Number);
      expect(tokens[2].strValue).toEqual("1");

      expect(tokens[4].type).toEqual(CssTokenType.Number);
      expect(tokens[4].strValue).toEqual("-2");

      expect(tokens[6].type).toEqual(CssTokenType.Number);
      expect(tokens[6].strValue).toEqual("3.0");

      expect(tokens[8].type).toEqual(CssTokenType.Number);
      expect(tokens[8].strValue).toEqual("-4.001");
    });

    it('should lex @keywords', () => {
      var cssCode = "@import()@something";
      var tokens = tokenize(cssCode);

      expect(tokens[0].type).toEqual(CssTokenType.AtKeyword);
      expect(tokens[0].strValue).toEqual('@import');

      expect(tokens[1].type).toEqual(CssTokenType.Character);
      expect(tokens[1].strValue).toEqual('(');

      expect(tokens[2].type).toEqual(CssTokenType.Character);
      expect(tokens[2].strValue).toEqual(')');

      expect(tokens[3].type).toEqual(CssTokenType.AtKeyword);
      expect(tokens[3].strValue).toEqual('@something');
    });

    it('should still lex a number even if it has a dimension suffix', () => {
      var cssCode = "40% is 40 percent";
      var tokens = tokenize(cssCode);

      expect(tokens[0].type).toEqual(CssTokenType.Number);
      expect(tokens[0].strValue).toEqual('40');

      expect(tokens[1].type).toEqual(CssTokenType.Character);
      expect(tokens[1].strValue).toEqual('%');

      expect(tokens[3].type).toEqual(CssTokenType.Identifier);
      expect(tokens[3].strValue).toEqual('is');

      expect(tokens[5].type).toEqual(CssTokenType.Number);
      expect(tokens[5].strValue).toEqual('40');
    });

    it('should allow escaped character and unicode character-strings in CSS selectors', () => {
      var cssCode = "\\123456 .some\\thing \{\}";
      var tokens = tokenize(cssCode);

      expect(tokens[0].type).toEqual(CssTokenType.Identifier);
      expect(tokens[0].strValue).toEqual('\\123456');

      expect(tokens[2].type).toEqual(CssTokenType.Character);
      expect(tokens[3].type).toEqual(CssTokenType.Identifier);
      expect(tokens[3].strValue).toEqual('some\\thing');
    });

    it('should distinguish identifiers and numbers from special characters', () => {
      var cssCode = "one*two=-4+three-4-equals_value$";
      var tokens = tokenize(cssCode);

      expect(tokens[0].type).toEqual(CssTokenType.Identifier);
      expect(tokens[0].strValue).toEqual("one");

      expect(tokens[1].type).toEqual(CssTokenType.Character);
      expect(tokens[1].strValue).toEqual("*");

      expect(tokens[2].type).toEqual(CssTokenType.Identifier);
      expect(tokens[2].strValue).toEqual("two");

      expect(tokens[3].type).toEqual(CssTokenType.Character);
      expect(tokens[3].strValue).toEqual("=");

      expect(tokens[4].type).toEqual(CssTokenType.Number);
      expect(tokens[4].strValue).toEqual("-4");

      expect(tokens[5].type).toEqual(CssTokenType.Character);
      expect(tokens[5].strValue).toEqual("+");

      expect(tokens[6].type).toEqual(CssTokenType.Identifier);
      expect(tokens[6].strValue).toEqual("three-4-equals_value$");
    });

    it('should filter out comments by default', () => {
      var cssCode = ".selector /* comment */ { /* value */ }";
      var tokens = tokenize(cssCode);

      expect(tokens[0].strValue).toEqual(".");
      expect(tokens[1].strValue).toEqual("selector");
      expect(tokens[2].strValue).toEqual(" ");
      expect(tokens[3].strValue).toEqual(" ");
      expect(tokens[4].strValue).toEqual("{");
      expect(tokens[5].strValue).toEqual(" ");
      expect(tokens[6].strValue).toEqual(" ");
      expect(tokens[7].strValue).toEqual("}");
    });

    it('should track comments when the flag is set to true', () => {
      var cssCode = ".selector /* comment */ { /* value */ }";
      var trackComments = true;
      var tokens = tokenize(cssCode, trackComments);

      expect(tokens[0].strValue).toEqual(".");
      expect(tokens[1].strValue).toEqual("selector");
      expect(tokens[2].strValue).toEqual(" ");

      expect(tokens[3].type).toEqual(CssTokenType.Comment);
      expect(tokens[3].strValue).toEqual("/* comment */");

      expect(tokens[4].strValue).toEqual(" ");
      expect(tokens[5].strValue).toEqual("{");
      expect(tokens[6].strValue).toEqual(" ");

      expect(tokens[7].type).toEqual(CssTokenType.Comment);
      expect(tokens[7].strValue).toEqual("/* value */");
    });
  });
}
