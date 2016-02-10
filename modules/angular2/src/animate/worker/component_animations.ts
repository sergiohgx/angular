/*
import {AnimationDefinition} from 'angular2/src/animate/worker/animation_definition';
import {isPresent} from 'angular2/src/facade/lang';

class ComponentAnimations {
  private _steps: {[key: string]: any}[] = [];
  private _cssDefinitions: string[];

  constructor() {}

  registerAnimation(steps: AnimationDefinition|{[key: string]: any}) {
    steps = (steps instanceof AnimationDefinition) ? steps.steps : steps;
    this._steps.push(steps);
  }

  getCssDefinitions(): string[] {
    if (!isPresent(this._cssDefinitions)) {
      this._cssDefinitions = [];
      this._steps.forEach((step) => {
        step['css'].forEach((cssDefinition) => {
          this._cssDefinitions.push(cssDefinition[0]);
        });
      });
    }
    return this._cssDefinitions;
  }

  buildAnimationStyles(tokens: string[], lookup: CssLookupVisitor): {[key: string]: any} {
    var styles = {};
    tokens.forEach((token) => {
      styles[token] = lookup.lookup(token);
    });
    return styles;
  }
}
*/
