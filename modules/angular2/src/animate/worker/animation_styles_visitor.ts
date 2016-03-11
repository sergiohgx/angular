import {isPresent} from "angular2/src/facade/lang";
import {BaseException} from 'angular2/src/facade/exceptions';

import {CssLexer, CssScanner} from 'angular2/src/compiler/css/lexer';

import {
  CssToken,
  CssParser,
  CssParseError,
  BlockType,
  CssAST,
  CssSelectorRuleAST,
  CssKeyframeRuleAST,
  CssKeyframeDefinitionAST,
  CssBlockDefinitionRuleAST,
  CssMediaQueryRuleAST,
  CssBlockRuleAST,
  CssInlineRuleAST,
  CssStyleValueAST,
  CssSelectorAST,
  CssDefinitionAST,
  CssStyleSheetAST,
  CssRuleAST,
  CssBlockAST,
  CssASTVisitor,
  CssUnknownTokenListAST
} from 'angular2/src/compiler/css/parser';

export class AnimationStylesVisitor implements CssASTVisitor {
  private _stylesheet: CssStyleSheetAST;

  private _definitions: {[key: string]: any};
  private _activeClasses: {[key: string]: boolean};
  private _currentSelector: string = null;
  private _currentDefinition: {[key: string]: any} = null;

  constructor(cssCode: string) {
    var lexer = new CssLexer();
    var scanner = lexer.scan(cssCode);
    var parser = new CssParser(scanner, 'inline-styles');
    var output = parser.parse();
    var errors = output.errors;
    if (errors.length) {
      throw new BaseException(errors.map((error: CssParseError) => error.msg).join(', '));
    }
    this._stylesheet = output.ast;
  }

  parse(activeClasses: string[], context?: any): {[key: string]: any} {
    this._definitions = {};
    this._activeClasses = makeIntoTable(activeClasses);
    this._stylesheet.visit(this, context);
    this._activeClasses = null;
    this._currentSelector = null;
    this._currentDefinition = null;
    var defs = this._definitions;
    this._definitions = {};
    return defs;
  }

  visitCssKeyframeRule(ast: CssKeyframeRuleAST, context?: any): void {
    ast.block.visit(this, context);
  }

  visitCssKeyframeDefinition(ast: CssKeyframeDefinitionAST, context?: any): void {
    ast.block.visit(this, context);
  }

  visitCssMediaQueryRule(ast: CssMediaQueryRuleAST, context?: any): void {
    ast.block.visit(this, context);
  }

  visitCssSelectorRule(ast: CssSelectorRuleAST, context?: any): void {
    ast.selectors.forEach((selAST: CssSelectorAST) => { selAST.visit(this, context); });
    ast.block.visit(this, context);
  }

  visitCssSelector(ast: CssSelectorAST, context?: any): void {
    if (!ast.isComplex) {
      var selector = valueFromTokens(ast.tokens, "");
      if (isPresent(this._activeClasses[selector])) {
        this._currentSelector = selector;
        if (!isPresent(this._definitions[this._currentSelector])) {
          this._definitions[this._currentSelector] = [];
        }
        this._currentDefinition = {};
        this._definitions[this._currentSelector].push([
          // TODO (matsko): media queries
          'all',
          this._currentDefinition
        ]);
        return;
      }
    }

    this._currentSelector = null;
    this._currentDefinition = null;
  }

  visitCssDefinition(ast: CssDefinitionAST, context?: any): void {
    if (isPresent(this._currentDefinition)) {
      var prop = ast.property.strValue;
      var value = ast.value.strValue;
      this._currentDefinition[prop] = value;
    }
  }

  visitCssBlock(ast: CssBlockAST, context?: any): void {
    ast.entries.forEach((entryAST: CssAST) => { entryAST.visit(this, context); });
  }

  visitCssStyleSheet(ast: CssStyleSheetAST, context?: any): void {
    ast.rules.forEach((ruleAST: CssRuleAST) => { ruleAST.visit(this, context); });
  }

  visitUnkownRule(ast: CssUnknownTokenListAST, context?: any): void {}
  visitCssValue(ast, context?: any): void { }
  visitInlineCssRule(ast, context?: any): void { }
}

function makeIntoTable(arr: string[]): {[key: string]: boolean} {
  var table: {[key: string]: boolean} = {};
  arr.forEach((value) => table[value] = true);
  return table;
}

function valueFromTokens(tokens: CssToken[], separator: string = " "): string {
  var value = "";
  for (var i = 0; i < tokens.length; i++) {
    if (i > 0) {
      value += separator;
    }
    value += tokens[i].strValue;
  }
  return value;
}
