import {AnimationFactory} from 'angular2/src/animate/animate';
import {query, style, transition, group, chain, parallel, RAFRunner} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

animations.find('animate-app', (ctx) => {

  ctx.onSwap({
    order: ['leave', 'enter'],
    leaveSetup: style({ opacity: 1 }),
    enterSetup: style({ position: 'fixed', top:0, left:0, right:0, opacity: 0 }),
    leave: chain([
      query(".special-user", transition({ opacity: 1 }, { opacity: 0 }, 1000)),
      transition({ opacity: 1}, { opacity: 0 }, 1000)
    ]),
    enter: transition(null, { opacity: 1 }, 1000)
  });

});
