import {AnimationFactory} from 'angular2/src/animate/animate';
import {
  query,
  staggerTimers,
  keyframe,
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

animations.find('animate-app', (ctx) => {

  ctx.trackClick();

  ctx.onClassRemove('modal-active', (element, className, animationContext: AnimationEventContext) => {
    var eventData = animationContext.detail;
    var events = animationContext.fetchAndBlockInnerEvents();

    return parallel([
      query('.overlay', transition({ opacity: 0 }, 1000)),
      query('modal', transition({ opacity: 0 }, 1000)),
    ]).start(element, animationContext).then(() => {
      triggerCallbacks(events);
    });
  });

  ctx.onClassAdd('modal-active', (element, className, animationContext: AnimationEventContext) => {
    var eventData = animationContext.detail;
    var events = animationContext.fetchAndBlockInnerEvents();

    var styleEvent = findEvent(events, 'style');
    var y = styleEvent.data.style.top;
    var x = styleEvent.data.style.left;

    var midY = parseInt(y) * 2;

    var clickEvent = findEvent(events, 'click');
    var button = clickEvent.target;
    var coords = button.getBoundingClientRect();

    var modal = element.querySelector('modal');
    var width = modal.offsetWidth;
    var height = modal.offsetHeight;

    var overlay = element.querySelector('modal');
    overlay.style.opacity = 0;
    modal.style.opacity = 0;

    var contents = element.querySelectorAll('modal .inner *');
    for (var i = 0; i < contents.length; i++) {
      contents[i].style.opacity = 0;
    }

    var fadeIn = function(duration, delay = null) {
      return transition({ opacity: 1}, duration, delay);
    }

    return chain([
      query('.overlay', style({ opacity: 0 })),

      query('modal', style({
        transform: 'scale(0)',
        'transform-origin': '0% 0%',
        top: px(clickEvent.screenY),
        left: px(clickEvent.screenX),
        opacity: 1
      })),

      chain([
        query('.overlay', fadeIn(500)),
        query('modal', transition({ top: px(midY), left: px(x), transform: 'scale(1)' }, 1000)),
        query('modal', transition({ top: px(y), left: px(x) }, 1000)),
        parallel([
          query('modal header', fadeIn(1000)),
          query('modal img', fadeIn(1000, 500)),
          query('modal p', fadeIn(1000, 800))
        ])
      ])

    ]).start(element, animationContext).then(() => {
      triggerCallbacks(events);
    });
  });

  function px(value) {
    if (!/px$/.test(value)) {
      value = value + 'px';
    }
    return value;
  }

  function findEvent(events, name) {
    return (events.filter((entry) => {
      return entry['event'] == name || (name == "click" && (entry instanceof MouseEvent));
    }) || [null])[0];
  }

  function triggerCallbacks(events) {
    events.forEach((event) => {
      event['callback']();
    });
  }
});
