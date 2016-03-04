import {BlockType, CssInlineRuleAST, CssSelectorRuleAST, CssKeyframeRuleAST, CssMediaQueryRuleAST, CssASTVisitor, CssStyleSheetAST, CssRuleAST, CssDefinitionAST, CssSelectorAST, CssBlockAST, CssStyleValueAST} from "angular2/src/compiler/css/parser";
import {NumberWrapper, StringWrapper, isPresent} from "angular2/src/facade/lang";

export class CssLookupVisitor implements CssASTVisitor {

  private _selectorMap: {[key: string]: any[]} = {};

  private _currentMediaQuery: string;
  private _currentSelector: string;
  private _currentKeyframe: string;
  private _currentCssBlock: {[key: string]: any};

  constructor(ast: CssStyleSheetAST) {
    this._selectorMap = {};
    this.visitCssStyleSheet(ast);
  }

  lookupRule(selector: string): any[] {
    var results = this._selectorMap[selector];
    if (!isPresent(results)) {
      throw new Error('no rule defined for ' + selector);
    }
    return results;
  }

  lookupSimpleRule(selector: string): any[] {
    var space = ' ';
    selector = StringWrapper.stripLeft(selector, space);
    selector = StringWrapper.stripRight(selector, space);
    if (selector.indexOf(space) > 0) {
      throw new Error('The CSS selector "' + selector + '" must be a simple CSS selector and cannot cross boundaries');
    }
    return this.lookupRule(selector);
  }

  visitCssStyleSheet(ast: CssStyleSheetAST) {
    ast.rules.forEach((rule) => {
      rule.visit(this);
    });
  }

  visitCssKeyframeRule(ast: CssKeyframeRuleAST) {
    var name = ast.name.strValue;
    var lookupName = '@' + name;
    var entries = this._selectorMap[lookupName];
    if (!isPresent(entries)) {
      entries = this._selectorMap[lookupName] = [];
    }

    this._currentKeyframe = name;
    this._currentCssBlock = {};
    entries.push({
      mediaQuery: this._currentMediaQuery,
      styles: this._currentCssBlock
    });

    ast.block.visit(this);

    this._currentKeyframe = null;
    this._currentCssBlock = null;
  }

  visitCssMediaQueryRule(ast: CssMediaQueryRuleAST) {
    this._currentMediaQuery = ast.name.strValue;
    ast.block.visit(this);
    this._currentMediaQuery = null;
  }

  visitCssSelectorRule(ast: CssSelectorRuleAST) {
    if (isPresent(this._currentKeyframe)) {
      ast.selectors.forEach((selector) => {
        var position = selector.strValue;
        var keyframeBlock = this._currentCssBlock;
        var positionBlock = this._currentCssBlock = {};
        ast.block.visit(this);
        keyframeBlock[position] = positionBlock;
        this._currentCssBlock = keyframeBlock;
      });
      return;
    }

    ast.selectors.forEach((selector) => {
      var name = selector.strValue;
      this._currentSelector = name;
      this._currentCssBlock = {};

      var entries = this._selectorMap[name];
      if (!isPresent(entries)) {
        entries = this._selectorMap[name] = [];
      }
      var mediaQueryStr = isPresent(this._currentMediaQuery) ? this._currentMediaQuery : 'all';
      entries.push({
        mediaQuery: mediaQueryStr,
        styles: this._currentCssBlock
      });

      ast.block.visit(this);

      this._currentSelector = null;
      this._currentCssBlock = null;
    });
  }

  visitCssDefinition(ast: CssDefinitionAST) {
    this._currentCssBlock[ast.property.strValue] = ast.value.strValue;
  }

  visitCssBlock(ast: CssBlockAST) {
    ast.entries.forEach(entry => {
      entry.visit(this);
    });
  }

  visitInlineCssRule(ast: CssInlineRuleAST) {
    // not used
  }

  visitCssSelector(ast: CssSelectorAST) {
    // not used
  }

  visitCssValue(ast: CssStyleValueAST) {
    // not used
  }
}
