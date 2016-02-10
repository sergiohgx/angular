import {isPresent} from 'angular2/src/facade/lang';
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
    value = NumberWrapper.parseIntAutoRadix(time.substring(0, time.length - chop)) * modifier;
  }
  return value;
}

function parseTime(time:string): number {
  return isPresent(time) && time.length > 0 ? parseInt(time) : 0;
}

export class AnimationDefinition {
  private _css: any[];
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
      'steps': this._steps,
      'staggerName': this._staggerName,
      'staggerDelay': parseTime(this._staggerDelay)
    };
  }

  constructor(private _query: string = null) {}

  css(exp: string): AnimationDefinition {
    if (isPresent(this._css)) {
      throw new Error("css has already been set");
    }

    this._css = [];
    exp.split(/\s*,\s*/g).forEach((cssDef) => {
      var cssTokenAndTime = cssDef.split(/\s+/g);
      var cssTokenName = cssTokenAndTime[0];
      var duration = cssTokenAndTime.length > 1 ? parseTime(cssTokenAndTime[1]) : 0;
      var values = [cssTokenName, duration];

      if (cssTokenAndTime.length > 2) {
        values.push(parseTime(cssTokenAndTime[2]));
      }

      this._css.push(values);
    });

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

export function css(exp: string): AnimationDefinition {
  return new AnimationDefinition().css(exp);
}
