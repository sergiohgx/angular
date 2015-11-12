import {parseTime} from 'angular2/src/animate/util';
import {isString, isBlank, isPresent} from 'angular2/src/facade/lang';

export class AnimationEntry {

  public keyframe: boolean = false;

  public constructor(public name: string,
                     public duration: number = 0,
                     public delay: number = 0,
                     public easing: string = null) {
    this.keyframe = name[0] == "@";
  }

  static parseExpression(exp: string): AnimationEntry[] {
    return exp.split(/\s*,\s*/).map((str) => {
      var match = str.match(/^([\.\@][-\w]+)(?:\s+(\d+m?s))?(?:\s+(\d+m?s))?(?:\s+(\D[-a-z]*))?$/);
      if (!match || match.length == 0) {
        throw new Error("Error: \"" + str + "\" is not a validation animation expression");
      }

      var duration = match.length > 2 ? parseTime(match[2]) : null;
      var delay    = match.length > 3 ? parseTime(match[3]) : null;
      var easing   = match.length > 4 ? match[4] : null;

      return new AnimationEntry(match[1], duration, delay, easing);
    });
  }
}

export class AnimationExpression {
  public method: string = 'css';
  public animations: AnimationEntry[];

  private _duration: number;
  private _delay: number;

  public staggerDelay: number;
  public staggerMethod: string;

  static fromObject(data: any): AnimationExpression {
    var exp = new AnimationExpression();

    if (isPresent(data['method'])) {
      exp.method = data['method'];
    }

    if (isPresent(data['animationData'])) {
      exp.animations = AnimationEntry.parseExpression(data['animationData']);
    }

    exp.duration = data['duration'];
    exp.delay = data['delay'];

    exp.staggerMethod = data['staggerMethod'];
    if (isPresent(data['staggerData'])) {
      var staggerDelay = data['staggerData'].match(/\d+m?s/g);
      if (staggerDelay && staggerDelay.length) {
        exp.staggerDelay = parseTime(staggerDelay[0]);
      }
    }

    return exp;
  }

  set delay(value: number) {
    this._delay = value;
  }

  get delay() {
    if (!this._delay) {
      this._delay = this.animations.reduce((a, b) => {
        return Math.max(a, b.delay);
      }, 0);
    }
    return this._delay;
  }

  set duration(value: number) {
    this._duration = value;
  }

  get duration() {
    if (!this._duration) {
      this._duration = this.animations.reduce((a, b) => {
        return Math.max(a, b.duration);
      }, 0);
    }
    return this._duration;
  }
}
