import {
  AsyncTestCompleter,
  describe,
  proxy,
  it,
  iit,
  ddescribe,
  expect,
  inject
} from 'angular2/testing_internal';

import {ListWrapper} from 'angular2/src/facade/collection';
import {StringWrapper} from 'angular2/src/facade/lang';
import {encodeURI} from 'angular2/src/compiler/uri_encode';

function assertEquals(v1, v2) {
  expect(v1).toEqual(v2);
}

export function main() {
  describe('encodeURI', () => {
    it("should replace the char value for 0x007D", () => {
      var cc1 = 0x007D;
      var s1 = StringWrapper.fromCharCode(cc1);
      assertEquals('%7D', encodeURI(s1));
    });

    it("should replace the char value for 0x0000", () => {
      var cc2 = 0x0000;
      var s2 = StringWrapper.fromCharCode(cc2);
      assertEquals('%00', encodeURI(s2));
    });

    it("should replace the char value for 0x0080", () => {
      var cc3 = 0x0080;
      var s3 = StringWrapper.fromCharCode(cc3);
      assertEquals('%C2%80', encodeURI(s3));
    });

    it("should replace the char value for 0x0555", () => {
      var cc4 = 0x0555;
      var s4 = StringWrapper.fromCharCode(cc4);
      assertEquals('%D5%95', encodeURI(s4));
    });

    it("should replace the char value for 0x07FF", () => {
      var cc5 = 0x07FF;
      var s5 = StringWrapper.fromCharCode(cc5);
      assertEquals('%DF%BF', encodeURI(s5));
    });

    it("should replace the char value for 0x0800", () => {
      var cc6 = 0x0800;
      var s6 = StringWrapper.fromCharCode(cc6);
      assertEquals('%E0%A0%80', encodeURI(s6));
    });

    it("should replace the char value for 0xAEEE", () => {
      var cc7 = 0xAEEE;
      var s7 = StringWrapper.fromCharCode(cc7);
      assertEquals('%EA%BB%AE', encodeURI(s7));
    });

    it("should replace the char value for 0xD800 and 0xDC00", () => {
      var cc8_1 = 0xD800;
      var cc8_2 = 0xDC00;
      var s8 = StringWrapper.fromCharCode(cc8_1) + StringWrapper.fromCharCode(cc8_2);
      assertEquals('%F0%90%80%80', encodeURI(s8));
    });

    it("should replace the char value for 0xDBFF and 0xDFFF", () => {
      var cc9_1 = 0xDBFF;
      var cc9_2 = 0xDFFF;
      var s9 = StringWrapper.fromCharCode(cc9_1) + StringWrapper.fromCharCode(cc9_2);
      assertEquals('%F4%8F%BF%BF', encodeURI(s9));
    });

    it("should replace the char value for 0xE000", () => {
      var cc10 = 0xE000;
      var s10 = StringWrapper.fromCharCode(cc10);
      assertEquals('%EE%80%80', encodeURI(s10));
    });
  });
}
