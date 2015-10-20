import {AnimationFactory} from 'angular2/src/animate/animate';
import {
  query,
  staggerTimers,
  keyframe,
  timeline,
  stagger,
  style,
  transition,
  group,
  chain,
  parallel,
  RAFRunner,
  AnimationEventContext
} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

animations.add('animate-app', (ctx) => {

  var runner;

  ctx.onClassAdd('.page-active', (element, className, animationContext: AnimationEventContext) => {
    var animation = chain([
      query(".author", style({ opacity: 0 })),
      query(".authors", style({ background:'rgb(255,255,255)' })),
      query("p", style({ opacity:0, transform: 'translateY(-100px)' })),

      query(".author", stagger(transition({ opacity: 1 }, 1000), 100)),

      query("p", stagger(transition({ opacity:1 ,transform: 'translateY(0px)' }, 1000), 200)),

      query(".authors", transition({ background:'rgb(225,225,225)' }, 1000)),
    ])

    var debug = false;
    if (debug) {
      return animation.start(element, animationContext);
    } else {
      var player = timeline(animation);
      runner = player.start(element, animationContext);
      return runner;
    }
  });

  ctx.on('drag', (element, animationContext: AnimationEventContext) => {
    if (!runner) return;

    var event = animationContext.event;
    var y = event.offsetY;

    var pageHeight = element.parentNode.clientHeight;
    var percentage = y / pageHeight;
    percentage = Math.max(0, percentage);
    percentage = Math.min(100, percentage);

    var lab = Math.floor(percentage * 100);
    element.innerHTML = lab + "%";

    runner.progress(percentage);
  });
});
