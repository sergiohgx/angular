import {NumberWrapper, StringWrapper, isPresent} from "angular2/src/facade/lang";
import {BaseException} from 'angular2/src/facade/exceptions';

import {
  isNewline,
  isWhitespace,
  $EOF,
  $HASH,
  $TILDA,
  $CARET,
  $PERCENT,
  $$,
  $_,
  $COLON,
  $SQ,
  $DQ,
  $EQ,
  $SLASH,
  $BACKSLASH,
  $PERIOD,
  $STAR,
  $PLUS,
  $LPAREN,
  $RPAREN,
  $LBRACE,
  $RBRACE,
  $LBRACKET,
  $RBRACKET,
  $PIPE,
  $COMMA,
  $SEMICOLON,
  $MINUS,
  $AT,
  $GT,
  $a,
  $A,
  $z,
  $Z,
  $0,
  $9
} from "angular2/src/core/change_detection/parser/lexer";

export {
  $EOF,
  $AT,
  $RBRACE,
  $LBRACE,
  $COMMA,
  $SEMICOLON
} from "angular2/src/core/change_detection/parser/lexer";

export enum CssTokenType {
  String,
  Comment,
  Identifier,
  Number,
  AtKeyword,
  Character,
  Whitespace
}

function combineTokens(a: CssToken, b: CssToken): CssToken {
  var lhs = a.index < b.index ? a : b;
  var rhs = a.index < b.index ? b : a;
  return new CssToken(lhs.index, lhs.column, lhs.line, lhs.type, lhs.strValue + rhs.strValue);
}

function findProblemCode(input, index, column, line) {
  var endOfProblemLine = index;
  var current = input[index];
  while (!isNewline(current) && current != $EOF) {
    current = input[++endOfProblemLine];
  }
  var choppedString = input.substring(0, endOfProblemLine);
  var pointerString = "^";
  var pointerPadding = "";
  for (var i = 1; i < column; i++) {
    pointerPadding += " ";
  }
  return choppedString + "\n" + pointerPadding + pointerString + "\n\n";
}

export class CssToken {
  numValue: number;
  constructor(public index: number, public column: number, public line: number,
              public type: CssTokenType, public strValue: string) {
    this.numValue = charCode(strValue, 0);
  }
}

export class CssLexer {
  scan(text: string, trackComments: boolean = false): CssScanner {
    return new CssScanner(text, trackComments);
  }
}

export class ScannerError extends BaseException {
  constructor(public message) { super(); }

  toString(): string { return this.message; }
}

export class CssScanner {
  peek: number;
  peekPeek: number;
  length: number = 0;
  index: number = -1;
  column: number = -1;
  line: number = 0;

  constructor(public input: string, private _trackComments: boolean = false) {
    this.length = this.input.length;
    this.peekPeek = this.peekAt(0);
    this.advance();
  }

  advance() {
    if (isNewline(this.peek)) {
      this.column = 0;
      this.line++;
    } else {
      this.column++;
    }

    this.index++;
    this.peek = this.peekPeek;
    this.peekPeek = this.peekAt(this.index + 1);
  }

  peekAt(index) {
    return index >= this.length ? $EOF : StringWrapper.charCodeAt(this.input, index);
  }

  consumeWhitespace(makeAssertion: boolean = false) {
    var count = 0;
    while ((isWhitespace(this.peek) || isNewline(this.peek)) && this.peek != $EOF) {
      count++;
      this.advance();
      if (!this._trackComments && isCommentStart(this.peek, this.peekPeek)) {
        this.advance();
        this.advance();
        while (!isCommentEnd(this.peek, this.peekPeek)) {
          if (this.peek == $EOF) {
            this.error('Unterminated comment');
          }
          this.advance();
        }
        this.advance();
        this.advance();
      }
    }
    if (makeAssertion && count == 0) {
      throw new ScannerError(`expected one or more whitespace characters to be consumed`);
    }
  }

  consume(type: CssTokenType, value: string = null): CssToken {
    var next = this.scan();
    this.assertCondition(next != null, "Next consume token not found");
    this.assertCondition(next.type == type, "Error: " + next.type.toString() +
                                                " does not match expected " + type.toString() +
                                                " value");

    if (isPresent(value)) {
      if (value != next.strValue) {
        throw new ScannerError('expected ' + value + ' to be ' + next.strValue);
      }
    }

    return next;
  }

  scan(): CssToken {
    var peek = this.peek;
    var peekPeek = this.peekPeek;
    if (peek == $EOF) return null;

    if (isCommentStart(peek, peekPeek)) {
      // even if comments are not tracked we still lex the
      // comment so we can move the pointer forward
      var commentToken = this.scanComment();
      if (this._trackComments) {
        return commentToken;
      }

      // otherwise continue parsing the next content
      peek = this.peek;
      peekPeek = this.peekPeek;
    }

    if (isWhitespace(peek) || isNewline(peek)) {
      return this.scanWhitespace();
    }

    if (isStringStart(peek, peekPeek)) {
      return this.scanString();
    }

    var isModifier = peek == $PLUS || peek == $MINUS;
    var digitA = isModifier ? false : isDigit(peek);
    var digitB = isDigit(peekPeek);
    if (digitA || (isModifier && (peekPeek == $PERIOD || digitB)) || (peek == $PERIOD && digitB)) {
      return this.scanNumber();
    }

    if (peek == $AT) {
      return this.scanAtExpression();
    }

    if (isIdentifierStart(peek, peekPeek)) {
      return this.scanIdentifier();
    }

    if (isValidCssCharacter(peek)) {
      return this.scanCharacter();
    }

    this.error(`Unexpected character [${StringWrapper.fromCharCode(peek)}]`);
    return null;
  }

  scanComment() {
    this.assertCondition(isCommentStart(this.peek, this.peekPeek), "Expected comment start value");

    var start = this.index;
    var startingColumn = this.column;
    var startingLine = this.line;

    this.advance();  // /
    this.advance();  // *

    while (!isCommentEnd(this.peek, this.peekPeek)) {
      if (this.peek == $EOF) {
        this.error('Unterminated comment');
      }
      this.advance();
    }

    this.advance();  // *
    this.advance();  // /

    var str = this.input.substring(start, this.index);
    return new CssToken(start, startingColumn, startingLine, CssTokenType.Comment, str);
  }

  scanWhitespace() {
    var start = this.index;
    var startingColumn = this.column;
    var startingLine = this.line;
    while (isWhitespace(this.peek) && this.peek != $EOF) {
      this.advance();
    }
    var str = this.input.substring(start, this.index);
    return new CssToken(start, startingColumn, startingLine, CssTokenType.Whitespace, str);
  }

  scanString() {
    this.assertCondition(isStringStart(this.peek, this.peekPeek),
                         "Unexpected non-string starting value");

    var target = this.peek;
    var start = this.index;
    var startingColumn = this.column;
    var startingLine = this.line;
    var previous = target;
    this.advance();

    while (!isCharMatch(target, previous, this.peek)) {
      if (this.peek == $EOF || isNewline(this.peek)) {
        this.error('Unterminated quote');
      }
      previous = this.peek;
      this.advance();
    }

    this.assertCondition(this.peek == target, "Unterminated quote");
    this.advance();

    var str = this.input.substring(start, this.index);
    return new CssToken(start, startingColumn, startingLine, CssTokenType.String, str);
  }

  scanNumber() {
    var start = this.index;
    var startingColumn = this.column;
    if (this.peek == $PLUS || this.peek == $MINUS) {
      this.advance();
    }
    var periodUsed = false;
    while (isDigit(this.peek) || this.peek == $PERIOD) {
      if (this.peek == $PERIOD) {
        if (periodUsed) {
          this.error('Unexpected use of a second period value');
        }
        periodUsed = true;
      }
      this.advance();
    }
    var strValue = this.input.substring(start, this.index);
    return new CssToken(start, startingColumn, this.line, CssTokenType.Number, strValue);
  }

  scanIdentifier() {
    this.assertCondition(isIdentifierStart(this.peek, this.peekPeek),
                         'Expected identifier starting value');
    var start = this.index;
    var startingColumn = this.column;
    while (isIdentifierPart(this.peek)) {
      this.advance();
    }
    var strValue = this.input.substring(start, this.index);
    return new CssToken(start, startingColumn, this.line, CssTokenType.Identifier, strValue);
  }

  scanCharacter() {
    var start = this.index;
    var startingColumn = this.column;
    this.assertCondition(isValidCssCharacter(this.peek),
                         charStr(this.peek) + ' is not a valid CSS character');
    var c = this.input.substring(start, start + 1);
    this.advance();

    return new CssToken(start, startingColumn, this.line, CssTokenType.Character, c);
  }

  scanAtExpression() {
    this.assertCondition(this.peek == $AT, 'Expected @ value');
    var start = this.index;
    var startingColumn = this.column;
    this.advance();
    if (isIdentifierStart(this.peek, this.peekPeek)) {
      var ident = this.scanIdentifier();
      var strValue = '@' + ident.strValue;
      return new CssToken(start, startingColumn, this.line, CssTokenType.AtKeyword, strValue);
    } else {
      return this.scanCharacter();
    }
  }

  assertCondition(status: boolean, errorMessage: string) {
    if (!status) {
      this.error(errorMessage);
    }
  }

  error(message: string) {
    var index: number = this.index;
    var column: number = this.column;
    var line: number = this.line;
    throw new ScannerError(
        `Lexer Error: ${message} at column ${line}:${column} in expression [${findProblemCode(this.input, index, column, line)}]`);
  }
}

function isAtKeyword(current: CssToken, next: CssToken): boolean {
  return current.numValue == $AT && next.type == CssTokenType.Identifier;
}

function isCharMatch(target: number, previous: number, code: number) {
  return code == target && previous != $BACKSLASH;
}

function isDigit(code: number): boolean {
  return $0 <= code && code <= $9;
}

function isCommentStart(code: number, next: number) {
  return code == $SLASH && next == $STAR;
}

function isCommentEnd(code: number, next: number) {
  return code == $STAR && next == $SLASH;
}

function isStringStart(code: number, next: number): boolean {
  var target = code;
  if (target == $BACKSLASH) {
    target = next;
  }
  return target == $DQ || target == $SQ;
}

function isIdentifierStart(code: number, next: number): boolean {
  var target = code;
  if (target == $MINUS) {
    target = next;
  }
  return ($a <= target && target <= $z) || ($A <= target && target <= $Z) || target == $BACKSLASH ||
         target == $MINUS || target == $_ || target == $$;
}

function isIdentifierPart(target: number) {
  return ($a <= target && target <= $z) || ($A <= target && target <= $Z) || target == $BACKSLASH ||
         target == $MINUS || target == $_ || target == $$ || isDigit(target);
}

function isValidCssCharacter(code: number) {
  switch (code) {
    case $HASH:
    case $TILDA:
    case $CARET:
    case $SLASH:
    case $BACKSLASH:
    case $$:
    case $_:
    case $COLON:
    case $PERCENT:
    case $EQ:
    case $PERIOD:
    case $STAR:
    case $PLUS:
    case $LPAREN:
    case $RPAREN:
    case $LBRACE:
    case $RBRACE:
    case $LBRACKET:
    case $RBRACKET:
    case $PIPE:
    case $COMMA:
    case $SEMICOLON:
    case $MINUS:
    case $AT:
    case $GT:
      return true;
  }
}

function charCode(input, index): number {
  return index >= input.length ? $EOF : StringWrapper.charCodeAt(input, index);
}

function charStr(code: number): string {
  return StringWrapper.fromCharCode(code);
}
