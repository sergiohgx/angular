import {NumberWrapper, StringWrapper, isPresent} from "angular2/src/facade/lang";
import {BaseException} from 'angular2/src/facade/exceptions';

import {
  CssToken,
  CssTokenType,
  CssScanner,
  $AT,
  $EOF,
  $RBRACE,
  $LBRACE,
  $COMMA,
  $SEMICOLON
} from "angular2/src/compiler/css/lexer";

export enum BlockType {
  Import,
  Charset,
  Namespace,
  Supports,
  Keyframes,
  MediaQuery,
  Selector,
  FontFace,
  Page,
  Document,
  Viewport
}

export class CssAST {
  visit(visitor: CssASTVisitor): void {}
}

export interface CssASTVisitor {
  visitCssValue(ast: CssStyleValueAST): void;
  visitInlineCssRule(ast: CssInlineRuleAST): void;
  visitCssKeyframeRule(ast: CssKeyframeRuleAST): void;
  visitCssMediaQueryRule(ast: CssMediaQueryRuleAST): void;
  visitCssSelectorRule(ast: CssSelectorRuleAST): void;
  visitCssSelector(ast: CssSelectorAST): void;
  visitCssDefinition(ast: CssDefinitionAST): void;
  visitCssBlock(ast: CssBlockAST): void;
  visitCssStyleSheet(ast: CssStyleSheetAST): void;
}

export class CssParser {
  constructor(private _scanner: CssScanner) {}

  _resolveBlockType(name: string) {
    switch (name) {
      case '@-webkit-keyframes':
      case '@keyframes':
        return BlockType.Keyframes;

      case '@charset':
        return BlockType.Charset;

      case '@import':
        return BlockType.Import;

      case '@namespace':
        return BlockType.Namespace;

      case '@page':
        return BlockType.Page;

      case '@document':
        return BlockType.Document;

      case '@media':
        return BlockType.MediaQuery;

      case '@font-face':
        return BlockType.FontFace;

      case '@viewport':
        return BlockType.Viewport;

      case '@supports':
        return BlockType.Supports;

      default:
        throw new ParserError(name + " isn't allowed");
    }
  }

  parseStyleSheet(): CssStyleSheetAST {
    var results = [];
    this.consumeSeparatorTokens();
    while (this._scanner.peek != $EOF) {
      results.push(this.parseRule());
      this._scanner.consumeWhitespace();
    }
    return new CssStyleSheetAST(results);
  }

  parseRule(): CssRuleAST {
    if (this._scanner.peek == $AT) {
      return this.parseAtRule();
    }
    return this.parseSelectorRule();
  }

  parseAtRule(): CssRuleAST {
    var token = this._scanner.scan();
    assert(token.type == CssTokenType.AtKeyword);

    var type = this._resolveBlockType(token.strValue);
    this._scanner.consumeWhitespace();

    var block;
    switch (type) {
      case BlockType.Charset:
      case BlockType.Namespace:
      case BlockType.Import:
        var value = this.parseValue();
        return new CssInlineRuleAST(type, value);

      case BlockType.Viewport:
      case BlockType.FontFace:
        block = this.parseStyleBlock();
        return new CssBlockRuleAST(type, block);

      case BlockType.Keyframes:
        var tokens = this._collectUntilBrace();
        // keyframes only have one identifier name
        var name = tokens[0];
        return new CssKeyframeRuleAST(name, this.parseBlock());

      case BlockType.MediaQuery:
        var tokens = this._collectUntilBrace();
        return new CssMediaQueryRuleAST(tokens, this.parseBlock());

      case BlockType.Document:
      case BlockType.Supports:
      case BlockType.Page:
        var tokens = this._collectUntilBrace();
        return new CssBlockDefinitionRuleAST(type, tokens, this.parseBlock());
    }

    return null;
  }

  parseSelectorRule(): CssSelectorRuleAST {
    var selectors = [];
    while (this._scanner.peek != $EOF && this._scanner.peek != $LBRACE) {
      this._scanner.consumeWhitespace();
      selectors.push(this.parseSelector());
      this._scanner.consumeWhitespace();
    }
    this._scanner.consumeWhitespace();
    var block = this.parseStyleBlock();
    return new CssSelectorRuleAST(selectors, block);
  }

  parseSelector(): CssSelectorAST {
    var selectorCssTokens = [];
    var isComplex = false;
    var wsCssToken;
    var p = this._scanner.peek;
    while (p != $EOF) {
      if (p == $COMMA || p == $LBRACE || p == $RBRACE) break;

      var token = this._scanner.scan();

      if (token.type == CssTokenType.Whitespace) {
        wsCssToken = token;
      } else {
        if (isPresent(wsCssToken)) {
          selectorCssTokens.push(wsCssToken);
          wsCssToken = null;
          isComplex = true;
        }
        selectorCssTokens.push(token);
      }

      p = this._scanner.peek;
    }
    return new CssSelectorAST(selectorCssTokens, isComplex);
  }

  parseValue(): CssStyleValueAST {
    var strValue = "";
    var tokens = [];
    var wsCssToken;

    var p = this._scanner.peek;
    while (p != $EOF) {
      // TODO (matsko): validate somehow if another property shows up
      if (p == $RBRACE || p == $SEMICOLON) break;

      var token = this._scanner.scan();
      if (token.type == CssTokenType.Whitespace) {
        wsCssToken = token;
      } else {
        if (isPresent(wsCssToken)) {
          tokens.push(wsCssToken);
          strValue += " ";
          wsCssToken = null;
        }
        tokens.push(token);
        strValue += token.strValue;
      }

      p = this._scanner.peek;
    }

    this.consumeSeparatorTokens();
    return new CssStyleValueAST(strValue, tokens);
  }

  _collectUntilBrace(): CssToken[] {
    this._scanner.consumeWhitespace();

    var lastWsCssToken: CssToken;
    var tokens = [];
    var p = this._scanner.peek;
    while (p != $EOF) {
      if (p == $LBRACE || p == $RBRACE) break;

      var token = this._scanner.scan();
      if (token.type == CssTokenType.Whitespace) {
        lastWsCssToken = token;
      } else {
        if (isPresent(lastWsCssToken)) {
          tokens.push(lastWsCssToken);
          lastWsCssToken = null;
        }
        tokens.push(token);
      }
      p = this._scanner.peek;
    }
    return tokens;
  }

  parseBlock(): CssBlockAST {
    this._scanner.consume(CssTokenType.Character, '{');
    this.consumeSeparatorTokens();

    var results = [];
    while (this._scanner.peek != $RBRACE && this._scanner.peek != $EOF) {
      results.push(this.parseRule());
      this._scanner.consumeWhitespace();
    }

    this._scanner.consume(CssTokenType.Character, '}');
    this.consumeSeparatorTokens();

    return new CssBlockAST(results);
  }

  parseStyleBlock(): CssBlockAST {
    this._scanner.consume(CssTokenType.Character, '{');
    this.consumeSeparatorTokens();

    var definitions = [];
    while (this._scanner.peek != $RBRACE && this._scanner.peek != $EOF) {
      var def = this.parseDefinition();
      if (def == null) break;
      definitions.push(def);
    }

    this._scanner.consume(CssTokenType.Character, '}');
    this.consumeSeparatorTokens();

    return new CssBlockAST(definitions);
  }

  parseDefinition(): CssDefinitionAST {
    var prop = this._scanner.consume(CssTokenType.Identifier);
    this.consumeSeparatorTokens();
    this._scanner.consume(CssTokenType.Character, ':');
    this.consumeSeparatorTokens();
    var value = this.parseValue();
    return new CssDefinitionAST(prop, value);
  }

  consumeSeparatorTokens() {
    this._scanner.consumeWhitespace();
    while (this._scanner.peek == $SEMICOLON) {
      this._scanner.consume(CssTokenType.Character, ';');
      this._scanner.consumeWhitespace();
    }
  }
}

export class CssStyleValueAST extends CssAST {
  constructor(public strValue: string, public tokens: CssToken[]) { super(); }
  visit(visitor: CssASTVisitor) { visitor.visitCssValue(this); }
}

export class CssRuleAST extends CssAST {}

export class CssBlockRuleAST extends CssRuleAST {
  constructor(public type: BlockType, public block: CssBlockAST, public name: CssToken = null) {
    super();
  }
  visit(visitor: CssASTVisitor) { visitor.visitCssBlock(this.block); }
}

export class CssKeyframeRuleAST extends CssBlockRuleAST {
  constructor(name: CssToken, block: CssBlockAST) { super(BlockType.Keyframes, block, name); }
  visit(visitor: CssASTVisitor) { visitor.visitCssKeyframeRule(this); }
}

export class CssBlockDefinitionRuleAST extends CssBlockRuleAST {
  public strValue: string;
  constructor(type: BlockType, public query: CssToken[], block: CssBlockAST) {
    super(type, block);
    this.strValue = query.map(token => token.strValue).join("");
    var firstCssToken: CssToken = query[0];
    this.name = new CssToken(firstCssToken.index, firstCssToken.column, firstCssToken.line,
                             CssTokenType.Identifier, this.strValue);
  }
  visit(visitor: CssASTVisitor) { visitor.visitCssBlock(this.block); }
}

export class CssMediaQueryRuleAST extends CssBlockDefinitionRuleAST {
  constructor(query: CssToken[], block: CssBlockAST) { super(BlockType.MediaQuery, query, block); }
  visit(visitor: CssASTVisitor) { visitor.visitCssMediaQueryRule(this); }
}

export class CssInlineRuleAST extends CssRuleAST {
  constructor(public type: BlockType, public value: CssStyleValueAST) { super(); }
  visit(visitor: CssASTVisitor) { visitor.visitInlineCssRule(this); }
}

export class CssSelectorRuleAST extends CssBlockRuleAST {
  public strValue: string;

  constructor(public selectors: CssSelectorAST[], block: CssBlockAST) {
    super(BlockType.Selector, block);
    this.strValue = selectors.map(selector => selector.strValue).join(",");
  }

  visit(visitor: CssASTVisitor) { visitor.visitCssSelectorRule(this); }
}

export class CssDefinitionAST extends CssAST {
  constructor(public property: CssToken, public value: CssStyleValueAST) { super(); }
  visit(visitor: CssASTVisitor) { visitor.visitCssDefinition(this); }
}

export class CssSelectorAST extends CssAST {
  public strValue;
  constructor(public tokens: CssToken[], public isComplex: boolean = false) {
    super();
    this.strValue = tokens.map(token => token.strValue).join("");
  }
  visit(visitor: CssASTVisitor) { visitor.visitCssSelector(this); }
}

export class CssBlockAST extends CssAST {
  constructor(public entries: CssAST[]) { super(); }
  visit(visitor: CssASTVisitor) { visitor.visitCssBlock(this); }
}

export class CssStyleSheetAST extends CssAST {
  constructor(public rules: CssAST[]) { super(); }
  visit(visitor: CssASTVisitor) { visitor.visitCssStyleSheet(this); }
}

export class ParserError extends BaseException {
  constructor(public message) { super(); }
  toString(): string { return this.message; }
}
