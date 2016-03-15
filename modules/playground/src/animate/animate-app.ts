import {Component} from 'angular2/core';
import {animate, style, restore, save} from 'angular2/src/animate/worker/animation_definition';

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

    .rotated { transform: rotate(-180deg); }
    .visible { opacity:1; }
    .invisible { opacity:0; }
  `],
  animations: {
    ngEnter: [
      style({ height: '0px', opacity:0, transform:'rotate(-90deg)', color:'red', background: 'blue' }),
      restore([{ transform: 'scale(1.3)' }],'0.5s ease-out').stagger('50ms'),
      animate({ background: 'red' }, '0.5s'),
      restore('0.5s ease-out')
    ],
    ngLeave: [
      style(['.visible', { 'transform':'rotate(0deg)' }]),
      animate(['.invisible', '.rotated'], '0.5s ease-out').stagger('100ms')
    ],
    /*
    addClass: [
      style({ 'background':'blue' }),
      animate({ 'background':'red' }, '0.5s')
    ],
    removeClass: [
      style({ 'background':'red' }),
      animate({ 'background':'white' }, '0.5s')
    ],
    setAttribute: [
      style({ 'background':'red' }),
      animate({ 'background':'green' }, '0.5s')
    ]
    */
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
