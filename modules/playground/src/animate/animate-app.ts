import {Component} from 'angular2/core';
import {css} from 'angular2/src/animate/worker/animation_definition';

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
  `],
  animations: {
    'ng-enter': [
      css(['.invisible', '.rotated', {height: '0px'}], '0s'),
      css(['.visible', {height: '200px'}], '0.5s ease-out').stagger('40ms'),
      css('.white', '0s'),
      css(['.green', '.normal'], '0.5s').stagger('40ms')
    ],
    'ng-leave': [
      css(['.green', '.normal'], '0s'),
      css('.white', '0.5s').stagger('40ms'),
      css(['.visible', {height: '200px'}], '0s'),
      css(['.invisible', '.rotated', {height: '0px'}], '0.5s ease-out').stagger('40ms')
    ]
  },
  animationStyles: {
    '.white': [
      ['all', {'background': 'white' }]
    ],
    '.green': [
      ['all', {'background': 'green' }]
    ],
    '.rotated': [
      ['all', {'transform': 'rotate(180deg)' }]
    ],
    '.normal': [
      ['all', {'transform': 'rotate(0deg)' }]
    ],
    '.invisible': [
      ['all', {'opacity': '0' }]
    ],
    '.visible': [
      ['all', {'opacity': '1' }]
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
