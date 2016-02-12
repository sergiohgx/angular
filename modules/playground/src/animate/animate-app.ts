import {Component} from 'angular2/core';

@Component({
  selector: 'animate-app',
  animations: {
    'enter': 'something something',
    'leave': 'something something'
  },
  animationStyles: {
    '.my-enter': {
      'background': 'red'
    }
  },
  template: `
    <button (click)="visible=!visible">Allow</button>
    <hr />
    <p *ngFor="#item of items">
      lorem
    </p>
  `
})
export class AnimateApp {
  _visible: boolean = false;
  items = [];

  get visible() {
    return this._visible;
  }

  set visible(bool) {
    this._visible = bool;
    if (this._visible) {
      this.items = [1,2,3,4,5];
    } else {
      this.items = [];
    }
  }
}
