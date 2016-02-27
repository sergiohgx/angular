import {Component} from 'angular2/core';
import {animate, style} from 'angular2/src/animate/worker/animation_definition';

@Component({
  selector: 'animate-app',
  styles: [`
    button {
      padding:20px;
      background:red;
      font-size:20px;
      color:white;
      border:0;
      cursor:pointer;
    }

    div {
      height:200px;
      font-size:50px;
      border:2px solid black;
      width:200px;
      line-height:200px;
      display:inline-block;
      text-align:center;
      margin:10px;
    }

    .rotated { transform: rotate(-180deg); }
    .visible { opacity:1; }
    .invisible { opacity:0; }
  `],
  animations: {
    'ng-enter': [
      style(['.invisible', '.rotated' ]),
      animate(['.visible', { 'transform':'rotate(0deg)' }], '0.5s ease-out').stagger('100ms'),
    ],
    'ng-leave': [
      style(['.visible', { 'transform':'rotate(0deg)' }]),
      animate(['.invisible', '.rotated'], '0.5s ease-out').stagger('100ms')
    ]
  },
  template: `
    <button (click)="visible=!visible">Animate</button>
    <hr />
    <div *ngFor="#item of items">
      lorem
    </div>
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
      this.items = [1,2,3,4,5,
                    6,7,8,9,10,
                    11,12,13,14,15,
                    16,17,18,19,20];
    } else {
      this.items = [];
    }
  }
}
