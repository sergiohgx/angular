import {isPresent, isArray, isString, isStringMap, RegExpWrapper} from 'angular2/src/facade/lang';
import {BaseException} from 'angular2/src/facade/exceptions';
import {NumberWrapper} from 'angular2/src/facade/lang';

const ONE_SECOND = 1000;

function parseTime(time:string): number {
  var value = 0;
  var modifier = 1;
  if (isPresent(time) && time.length > 0) {
    var lastChar = time[time.length - 1];
    var chop = 0;
    if (lastChar == 's') {
      chop++;
      var secondLastChar = time[time.length - 2];
      if (secondLastChar == 'm') {
        chop++;
      } else {
        modifier = ONE_SECOND;
      }
    }
    value = NumberWrapper.parseFloat(time.substring(0, time.length - chop)) * modifier;
  }
  return value;
}

export class AnimationDefinition {
  private _css: any[];
  private _duration: number = 0;
  private _delay: number = 0;
  private _easing: string = 'linear';
  private _staggerDelay: string;
  private _staggerName: string;
  private _steps = [];

  get steps(): {[key: string]: any} {
    if (!isPresent(this._css) && this._steps.length == 0) {
      throw new BaseException('No animation has been set...');
    }

    return {
      'query': this._query,
      'css': this._css,
      'duration': this._duration,
      'delay': this._delay,
      'easing': this._easing,
      'steps': this._steps,
      'staggerName': this._staggerName,
      'staggerDelay': parseTime(this._staggerDelay)
    };
  }

  constructor(private _query: string = null) {}

  css(exp: any, timing: string = null): AnimationDefinition {
    if (isPresent(this._css)) {
      throw new Error("css has already been set");
    }

    this._css = [];
    if (isArray(exp)) {
      exp.forEach((cssDef) => {
        this._css.push(cssDef);
      });
    } else if (isString(exp) || isStringMap(exp)) {
      this._css.push(exp);
    } else {
      throw new Error("invalid input provided for css expression");
    }

    if (isPresent(timing)) {
      var values = timing.split(' ');
      var i = 0;
      if (isPresent(values[i])) {
        this._duration = parseTime(values[i++]);
      }

      // this means that the delay number value was detected
      var next = values.length > 1 ? values[i] : null;
      if (next != null && RegExpWrapper.test(/[0-9]/, next[0])) {
        i++;
        this._delay = parseTime(next);
      }

      if (isPresent(values[i])) {
        this._easing = values[i];
      }
    }

    return this;
  }

  pipe(fnName: string, args: any = null): AnimationDefinition {
    var input = [fnName];
    if (isPresent(args)) {
      input.push(args);
    }
    this._steps.push(input);
    return this;
  }

  stagger(name: string, delay: string = null): AnimationDefinition {
    if (!isPresent(delay)) {
      delay = name;
      name = 'linear';
    }
    this._staggerDelay = delay;
    this._staggerName = name;
    return this;
  }
}

export function fn(fn: string, args: any = null): AnimationDefinition {
  return new AnimationDefinition().pipe(fn, args);
}

export function query(selector: string): AnimationDefinition {
  return new AnimationDefinition(selector);
}

export function css(exp: any, timing: string = null): AnimationDefinition {
  return new AnimationDefinition().css(exp, timing);
}
