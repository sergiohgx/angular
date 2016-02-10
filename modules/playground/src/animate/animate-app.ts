import {Component} from 'angular2/core';
import {group, animate, style, sequence} from 'angular2/animate';

@Component({
  selector: 'animate-app',
  styleUrls: ['css/animate-app.css'],
  templateUrl: './animate-app.html',
  animations: {
    "ngEnter": [
      style({"height": 0, "opacity": 0}),
      style({"background": "gold"}),
      group([animate({"height": 100, "opacity": 1}, 500), animate({"background": "red"}, "2s")]),
      animate({"background": "white"}, "500ms")
    ],
    "ngLeave": sequence([
      style({"opacity": 1, "width": "200px"}),
      style({"background": "white"}),
      animate({"background": "blue", "opacity": 0, "width": 0}, "1000ms ease-out")
    ])
  }
})
export class AnimateApp {
  items = [];

  _visible: boolean = false;
  get visible() { return this._visible; }
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
