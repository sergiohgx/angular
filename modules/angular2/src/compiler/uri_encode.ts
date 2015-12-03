import {StringWrapper, isPresent, NumberWrapper} from 'angular2/src/facade/lang';
import {ListWrapper} from 'angular2/src/facade/collection';

function _charCodeAt(str: string, index: number): number {
  return StringWrapper.charCodeAt(str, index);
}

function _makeURIError() {
  return new Error("unable to parse URI");
}

function _hexValueOf(code: number): number {
  // 0-9
  if (code >= 48 && code <= 57) return code - 48;
  // A-F
  if (code >= 65 && code <= 70) return code - 55;
  // a-f
  if (code >= 97 && code <= 102) return code - 87;

  return -1;
}

// Does the char code correspond to an alpha-numeric char.
function _isAlphaNumeric(cc: number): boolean {
  // a - z
  if (97 <= cc && cc <= 122) return true;
  // A - Z
  if (65 <= cc && cc <= 90) return true;
  // 0 - 9
  if (48 <= cc && cc <= 57) return true;

  return false;
}

// Lazily initialized.
var hexCharCodeArray = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
                        65, 66, 67, 68, 69, 70];

function _URIAddEncodedOctetToBuffer(octet: number, result: number[]): void {
  result.push(37); // Char code of ''.
  result.push(hexCharCodeArray[octet >> 4]);
  result.push(hexCharCodeArray[octet & 0x0F]);
}

function _URIEncodeOctets(octets: number[], result: number[]): void {
  _URIAddEncodedOctetToBuffer(octets[0], result);
  if (isPresent(octets[1])) _URIAddEncodedOctetToBuffer(octets[1], result);
  if (isPresent(octets[2])) _URIAddEncodedOctetToBuffer(octets[2], result);
  if (octets.length > 3 && isPresent(octets[3])) _URIAddEncodedOctetToBuffer(octets[3], result);
}

function _URIEncodeSingle(cc: number, result: number[]): void {
  var x = (cc >> 12) & 0xF;
  var y = (cc >> 6) & 63;
  var z = cc & 63;
  var octets = ListWrapper.createFixedSize(3);
  if (cc <= 0x007F) {
    octets[0] = cc;
  } else if (cc <= 0x07FF) {
    octets[0] = y + 192;
    octets[1] = z + 128;
  } else {
    octets[0] = x + 224;
    octets[1] = y + 128;
    octets[2] = z + 128;
  }
  _URIEncodeOctets(octets, result);
}

function _URIEncodePair(cc1: number, cc2: number, result: number[]): void {
  cc1 = NumberWrapper.toInt(cc1);
  cc2 = NumberWrapper.toInt(cc2);

  var u = ((cc1 >> 6) & 0xF) + 1;
  var w = (cc1 >> 2) & 0xF;
  var x = cc1 & 3;
  var y = (cc2 >> 6) & 0xF;
  var z = cc2 & 63;
  var octets = ListWrapper.createFixedSize(4);
  octets[0] = (u >> 2) + 240;
  octets[1] = (((u & 3) << 4) | w) + 128;
  octets[2] = ((x << 4) | y) + 128;
  octets[3] = z + 128;
  _URIEncodeOctets(octets, result);
}

function _URIHexCharsToCharCode(highChar: number, lowChar: number): number {
  var highCode = _hexValueOf(highChar);
  var lowCode = _hexValueOf(lowChar);
  if (highCode == -1 || lowCode == -1) throw _makeURIError();
  return (highCode << 4) | lowCode;
}

function _encode(uri: string, unescape: Function): string {
  uri = uri.toString();
  var uriLength = uri.length;
  var array: number[] = [];
  for (var k = 0; k < uriLength; k++) {
    var cc1 = _charCodeAt(uri, k);
    if (unescape(cc1)) {
      array.push(cc1);
    } else {
      if (cc1 >= 0xDC00 && cc1 <= 0xDFFF) throw _makeURIError();
      if (cc1 < 0xD800 || cc1 > 0xDBFF) {
        _URIEncodeSingle(cc1, array);
      } else {
        k++;
        if (k == uriLength) throw _makeURIError();
        var cc2 = _charCodeAt(uri, k);
        if (cc2 < 0xDC00 || cc2 > 0xDFFF) throw _makeURIError();
        _URIEncodePair(cc1, cc2, array);
      }
    }
  }

  return array.map((value) => {
    return StringWrapper.fromCharCode(value);
  }).join('');
}

export function encodeURI(uri: string): string {
  var unescapePredicate = (cc: number) => {
    if (_isAlphaNumeric(cc)) return true;
    // !
    if (cc == 33) return true;
    // #$
    if (35 <= cc && cc <= 36) return true;
    // &'()*+,-./
    if (38 <= cc && cc <= 47) return true;
    // :;
    if (58 <= cc && cc <= 59) return true;
    // =
    if (cc == 61) return true;
    // ?@
    if (63 <= cc && cc <= 64) return true;
    // _
    if (cc == 95) return true;
    // ~
    if (cc == 126) return true;

    return false;
  };
  return _encode(uri, unescapePredicate);
}

export function encodeURIComponent(component: string): string {
  var unescapePredicate = (cc: number) => {
    if (_isAlphaNumeric(cc)) return true;
    // !
    if (cc == 33) return true;
    // '()*
    if (39 <= cc && cc <= 42) return true;
    // -.
    if (45 <= cc && cc <= 46) return true;
    // _
    if (cc == 95) return true;
    // ~
    if (cc == 126) return true;

    return false;
  };
  return _encode(component, unescapePredicate);
}
