import {isPresent} from 'angular2/src/facade/lang';

import {
  ENTER,
  LEAVE,
  ADD_CLASS,
  REMOVE_CLASS,
  SET_ATTRIBUTE,
  REMOVE_ATTRIBUTE
} from 'angular2/src/core/metadata/animations';

export abstract class AnimationEvent {
  public tokens: string[] = [];
  constructor(public id: string, tokens: string[]) {
    tokens.forEach(token => {
      if (isPresent(token)) {
        this.tokens.push(token);
      }
    });
  }
}

export class EnterAnimationEvent extends AnimationEvent {
  constructor() { super(ENTER, []); }
}

export class LeaveAnimationEvent extends AnimationEvent {
  constructor() { super(LEAVE, []); }
}

export class AddClassAnimationEvent extends AnimationEvent {
  constructor(className: string) { super(ADD_CLASS, [className]); }
}

export class RemoveClassAnimationEvent extends AnimationEvent {
  constructor(className: string) { super(REMOVE_CLASS, [className]); }
}

export class RemoveAttributeAnimationEvent extends AnimationEvent {
  constructor(attr: string) { super(REMOVE_ATTRIBUTE, [attr]); }
}

export class SetAttributeAnimationEvent extends AnimationEvent {
  constructor(attr: string, value: string) { super(SET_ATTRIBUTE, [attr, value]); }
}
