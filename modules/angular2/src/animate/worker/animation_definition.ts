import {isPresent, isArray, isString, isStringMap, RegExpWrapper} from 'angular2/src/facade/lang';
import {BaseException} from 'angular2/src/facade/exceptions';
import {NumberWrapper} from 'angular2/src/facade/lang';

const ONE_SECOND = 1000;

function pick(val1, val2) {
  return isPresent(val1) ? val1 : val2;
}

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
  private _css: any[] = [];
  private _duration: number = 0;
  private _delay: number = 0;
  private _easing: string = 'linear';
  private _staggerDelay: string;
  private _staggerName: string;
  private _transforms = [];

  get steps(): {[key: string]: any} {
    if (!isPresent(this._css) && this._transforms.length == 0) {
      throw new BaseException('No animation has been set...');
    }

    return {
      'query': this._query,
      'css': this._css,
      'duration': this._duration,
      'delay': this._delay,
      'easing': this._easing,
      'snapshot': this._snapshot,
      'snapshotStyles': this._snapshotStyles,
      'transforms': this._transforms,
      'staggerName': this._staggerName,
      'staggerDelay': parseTime(this._staggerDelay)
    };
  }

  constructor(private _query: string = null, private _snapshot: string = null, private _snapshotStyles = []) {}

  isInstantAnimation() {
    return this._css.length > 0 &&
           this._duration == 0 &&
           this._transforms.length == 0 &&
           this._snapshot == null;
  }

  style(exp: any): AnimationDefinition {
    return this.animate(exp, '0')
  }

  merge(def: AnimationDefinition) {
    var steps = def.steps;

    var css = [];
    this._css.forEach((val) => css.push(val));
    steps['css'].forEach((val) => css.push(val));
    this._css = css;

    this._query = pick(this._query, steps['query']);
    this._duration = pick(this._duration, steps['duration']);
    this._delay = pick(this._delay, steps['delay']);
    this._easing = pick(this._easing, steps['easing']);
    this._snapshot = pick(this._snapshot, steps['snapshot']);
    this._snapshotStyles = pick(this._snapshotStyles, steps['snapshotStyles']);
    this._transforms = pick(this._transforms, steps['transforms']);
    this._staggerName = pick(this._staggerName, steps['staggerName']);
    this._staggerDelay = pick(this._staggerDelay, steps['staggerDelay']);
  }

  animate(exp: any, timing: string): AnimationDefinition {
    if (this._css.length > 0) {
      throw new Error("css has already been set");
    }

    if (isArray(exp)) {
      exp.forEach((cssDef) => this._css.push(cssDef));
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

  transform(fnName: string, args: any = null): AnimationDefinition {
    var input = [fnName];
    if (isPresent(args)) {
      input.push(args);
    }
    this._transforms.push(input);
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
  return new AnimationDefinition().transform(fn, args);
}

export function query(selector: string): AnimationDefinition {
  return new AnimationDefinition(selector);
}

export function animate(exp: any, timing: string): AnimationDefinition {
  return new AnimationDefinition().animate(exp, timing);
}

export function style(exp: any): AnimationDefinition {
  return new AnimationDefinition().style(exp);
}

export function save(styles: string[]): AnimationDefinition {
  return snapshot(':initial', styles);
}

export function restore(styles, time = null): AnimationDefinition {
  var steps = [':initial'];
  if (arguments.length == 1) {
    time = styles;
    styles = [];
  } else {
    steps = steps.concat(styles);
  }
  return animate(steps, time);
}

export function snapshot(snapshot: string, snapshotStyles = []): AnimationDefinition {
  return new AnimationDefinition(null, snapshot, snapshotStyles);
}
