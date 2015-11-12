import {Component, View} from 'angular2/core';

@Component({selector: 'animate-app'})
@View({
  animationStyles: {
    '.fade-out': { 'opacity': '0' },
    '.fade-out-up': { 'opacity': '0', 'transform':'translateY(-100px)' },
    '.fade-in': { 'opacity': '1' },
    '.red': { 'background': 'red' },
    '.yellow': { 'background': 'yellow' },
    '.blue': { 'background': 'blue' },
    '.green': { 'background': 'green' }
  },

  animations: {
    'enter': [
      'fade-out!',
      'fade-in 1s / 100ms middleOut',
      'green 1s / 100ms leftToRight',
      'yellow 1s'
    ],

    'leave': [
      'fade-in!',
      'fade-out-up 1s / 100ms reverse'
    ]
  },
  template: `
    <h1>Enter</h1>
    <button (click)="toggleBoxes()">Animate</button>
    <hr />
    <div style="margin-top:50px;" class="box" *ngFor="#box of boxes">
      {{ box }}
    </div>
  `
})
export class AnimateApp {
  public boxes = [];

  toggleBoxes() {
    if (this.boxes.length) {
      this.boxes = [];
    } else {
      this.boxes = [0  , 1  , 2  , 3  , 4  , 5  , 6  , 7  , 8  , 9,
                    10 , 11 , 12 , 13 , 14 , 15 , 16 , 17 , 18 , 19, 20];
    }
  }
}
