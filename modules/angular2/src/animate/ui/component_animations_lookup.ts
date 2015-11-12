import {isPresent} from 'angular2/src/facade/lang';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {Animation} from 'angular2/src/animate/ui/animation';
import {AnimationOperation} from 'angular2/src/animate/ui/animation_operation';
import {NoOpAnimationDriver, AnimationDriver} from 'angular2/src/animate/ui/animation_driver';
import {CssAnimationsDriver} from 'angular2/src/animate/ui/drivers/css_animations';
import {WebAnimationsDriver} from 'angular2/src/animate/ui/drivers/web_animations';

function resolveDriver(name: string): AnimationDriver {
  switch(name) {
    case 'web-animations':
      return new WebAnimationsDriver();
      break;

    case 'css':
    case 'default':
      return new CssAnimationsDriver();
      break;

    default:
      throw new Error('Driver not found');
  }
}

function resolveDefaultDriver(): AnimationDriver {
  var drivers = [WebAnimationsDriver, CssAnimationsDriver, NoOpAnimationDriver];
  for (var i = 0; i < drivers.length; i++) {
    var driver = drivers[i];
    if (driver.isSupported()) {
      return new driver();
    }
  }
}

export class ComponentAnimationDefinition {

  public static defaultDriver = resolveDefaultDriver();

  public name: string;
  public driver: AnimationDriver;
  public on: string;
  public animation: Animation;

  constructor(name: string, options: {[key: string]: any}) {
    if (isPresent(options['animation'])) {
      this._fromLongForm(name, options);
    } else {
      this._fromShortForm(name, options);
    }
  }

  private _fromShortForm(name, options: {[key: string]: any}): void {
    this.name = name;
    this.animation = new AnimationOperation(options);
    this.on = name;
    this.driver = ComponentAnimationDefinition.defaultDriver;
  }

  private _fromLongForm(name: string, options: {[key: string]: any}): void {
    var animation = options['animation'];
    animation = animation instanceof Animation
        ? animation
        : new AnimationOperation(animation);

    this.name = name;
    this.animation = animation;
    this.on = options['on'];
    this.driver = isPresent(options['driver'])
        ? resolveDriver(options['driver'])
        : ComponentAnimationDefinition.defaultDriver;
  }
}


export class ComponentAnimationsLookup {
  private _animationsByEvent: {[key: string]: ComponentAnimationDefinition};
  private _animationsByName: {[key: string]: ComponentAnimationDefinition};

  static fromMap(definitions: {[key: string]: any}): ComponentAnimationsLookup {
    var defs = [];
    StringMapWrapper.forEach(definitions, (data, name) => {
      defs.push(new ComponentAnimationDefinition(name, data));
    });
    return new ComponentAnimationsLookup(defs);
  }

  constructor(definitions: ComponentAnimationDefinition[]) {
    this._animationsByEvent = {};
    this._animationsByName = {};
    definitions.forEach((def) => {
      this._animationsByName[def.name] = def;
      this._animationsByEvent[def.on] = def;
    });
  }

  getAnimationByEvent(event: string): ComponentAnimationDefinition {
    return this._animationsByEvent[event];
  }

  getAnimationByName(name: string): ComponentAnimationDefinition {
    return this._animationsByName[name];
  }
}
