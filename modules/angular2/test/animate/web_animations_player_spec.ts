import {isPresent} from "angular2/src/facade/lang";

import {
  AsyncTestCompleter,
  describe,
  proxy,
  it,
  iit,
  xit,
  el,
  ddescribe,
  expect,
  inject,
  beforeEach,
  SpyObject,
  beforeEachProviders
} from 'angular2/testing_internal';

import {WebAnimationsPlayer} from 'angular2/src/animate/ui/drivers/web_animations';

class MockWebAnimationsElementPlayer {
  public captures: {[key: string]: any[]} = {};

  _capture(method: string, data: any) {
    if (!isPresent(this.captures[method])) {
      this.captures[method] = [];
    }
    this.captures[method].push(data);
  }

  cancel() { this._capture('cancel', null); }
  play() { this._capture('play', null); }
  pause() { this._capture('pause', null); }
  reverse() { this._capture('reverse', null); }
  stop() { this._capture('stop', null); }
  set onfinish(fn) { this._capture('onfinish', fn); }
}

export function main() {
  describe('WebAnimationsPlayer', () => {
    var player, captures;
    beforeEach(() => {
      var mockPlayer = new MockWebAnimationsElementPlayer();
      captures = mockPlayer.captures;
      player = new WebAnimationsPlayer(mockPlayer);
    });

    it('should pause the animation', () => {
      expect(captures['pause']).toBeFalsy();
      player.pause();
      expect(captures['pause'].length).toEqual(1);
    });

    it('should play the animation', () => {
      expect(captures['play']).toBeFalsy();
      player.play();
      expect(captures['play'].length).toEqual(1);
    });

    it('should finish the animation', () => {
      expect(captures['stop']).toBeFalsy();
      player.finish();
      expect(captures['stop'].length).toEqual(1);
    });

    it('should reverse the animation', () => {
      expect(captures['reverse']).toBeFalsy();
      player.reverse();
      expect(captures['reverse'].length).toEqual(1);
    });

    it('should make use of the onfinish function', () => {
      expect(captures['onfinish'].length).toEqual(1);
    });

    it('should trigger the subscribe functions when complete', () => {
      var count = 0;
      var method = () => { count++; }
      player.onDone(method);
      player.onDone(method);
      player.onDone(method);

      expect(count).toEqual(0);
      captures['onfinish'][0]();
      expect(count).toEqual(3);
    });
  });
}
