import {Component} from 'angular2/core';
import {group, animate, style} from 'angular2/animate';

@Component({
  selector: 'animate-app',
  styleUrls: ['css/animate-app.css'],
  templateUrl: './animate-app.html',
  animations: {
    ngEnter: [
      style({ height: 0, opacity: 0 }),
      style({ background: 'white' }),
      style({ background: 'gold' }),
      group([
        animate({ height: 100, opacity:1 }, '0.5s'),
        animate({ background: 'red' }, '2s')
      ])
    ]
  }
})
export class AnimateApp {
  _visible: boolean = false;
  items = [];

  set visible(bool) {
    this._visible = bool;
    if (this._visible) {
      this.items = [
        1,2,3,4,5,
        6,7,8,9,10,
        11,12,13,14,15,
        16,17,18,19,20
      ];
    } else {
      this.items = [];
    }
  }
}
