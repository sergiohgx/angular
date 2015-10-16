import {AnimationFactory} from 'angular2/src/animate/animate';
import {cssClass, chain, parallel, transition} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

animations.add('animate-app', "animations.css", (ctx) => {

  ctx.onEnter(chain([
    cssClass("invisible!"),
    cssClass("visible", 1000)
  ]))

  ctx.onLeave(chain([
    cssClass("visible!"),
    parallel([
      transition({ transform: 'rotate(180deg)' }),
      transition({ transform: 'scale(10)' }),
      cssClass("invisible"),
      cssClass("mangle"),
      cssClass("red"),
      cssClass("blue")
    ], 1000)
  ]))

});
