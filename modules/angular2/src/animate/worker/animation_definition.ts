import {isPresent} from 'angular2/src/facade/lang';

export class AnimationDefinition {
  private _css: string;
  private _staggerDelay: string;
  private _staggerName: string;
  private _steps = [];

  get steps(): {[key: string]: any} {
    if (!isPresent(this._css) && this._steps.length == 0) {
      throw new Error('Please set an animation');
    }

    return {
      'query': this._query,
      'css': this._css,
      'steps': this._steps,
      'staggerName': this._staggerName,
      'staggerDelay': this._staggerDelay
    };
  }

  constructor(private _query: string = null) {}

  css(exp: string): AnimationDefinition {
    if (this._css) {
      throw new Error("css has already been set");
    }
    this._css = exp;
    return this;
  }

  fn(fnName: string, args: any = null): AnimationDefinition {
    var input = [fnName];
    if (isPresent(args)) {
      input.push(args);
    }
    this._steps.push(input);
    return this;
  }

  stagger(name: string, delay: string = null): AnimationDefinition {
    if(!isPresent(delay)) {
      delay = name;
      name = 'linear';
    }
    this._staggerDelay = delay;
    this._staggerName = name;
    return this;
  }
}

export function fn(fn: string, args: any = null): AnimationDefinition {
  return new AnimationDefinition().fn(fn, args);
}

export function query(selector: string): AnimationDefinition {
  return new AnimationDefinition(selector);
}

export function css(exp: string): AnimationDefinition {
  return new AnimationDefinition().css(exp);
}
