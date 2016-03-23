import {Component} from 'angular2/core';
import {animate, style} from 'angular2/animate';

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
      font-size:50px;
      border:2px solid black;
      width:200px;
      display:inline-block;
      vertical-align:top;
      text-align:center;
      margin:10px;
      overflow:hidden;
    }

    @keyframes flip {
      from { transform: rotate(-360deg); }
      to { transform: rotate(0deg); }
    }

    .visible { opacity:1; }
    .invisible { opacity:0; }
  `],
  animations: {
    ngEnter: [
      style({ height: 0, opacity: 0 }),
      animate(['.visible', { height: 200 }], 500),
      style({ background: 'white' }),
      animate([{ background: 'red' }, '@flip'], '0.5s')
    ],
    ngLeave: [
      style({ height: '200px', opacity: '1' }),
      animate({ height: '0', opacity: '0' }, '0.5s')
    ]
  },
  template: `
    <button (click)="visible=!visible">Animate</button>
    <hr />
    <div *ngFor="#item of items, #i = index">
      {{ item.value }}
      <span *ngIf="i == 1">
      jaosdjaosjdoajda
      </span>
    </div>
  `
})
export class AnimateApp {
  _visible: boolean = false;
  items = [];

  get visible() {
    return this._visible;
  }

  makeClass(index) {
    return index % 2 == 0 ? 'red' : 'green';
  }

  set visible(bool) {
    this._visible = bool;
    if (this._visible) {
      this.items = [
        { value: 1, exp: false },
        { value: 2, exp: false },
        { value: 3, exp: false },
        { value: 4, exp: false },
        { value: 5, exp: false },
        { value: 6, exp: false },
        { value: 7, exp: false },
        { value: 8, exp: false },
        { value: 9, exp: false },
        { value: 10, exp: false },
        { value: 11, exp: false },
        { value: 12, exp: false },
        { value: 13, exp: false },
        { value: 14, exp: false },
        { value: 15, exp: false },
        { value: 16, exp: false },
        { value: 17, exp: false },
        { value: 18, exp: false },
        { value: 19, exp: false },
        { value: 20, exp: false }
      ];
    } else {
      this.items = [];
    }
  }
}
