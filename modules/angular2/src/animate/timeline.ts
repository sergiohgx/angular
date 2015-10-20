export function copyObj(obj) {
  var newObj = {};
  for (var i in obj) {
    newObj[i] = obj[i];
  }
  return newObj;
}

export class WebAnimationsDriver {
  static create(element, steps, duration) {
    return new WebAnimationsDriver(element, steps, duration);
  }

  private _steps;
  private _player;
  private _closingPromise;

  constructor(private _element, steps, private _duration) {
    this._steps = this._formatSteps(steps, _duration);
  }

  _formatSteps(steps, totalDuration) {
    var compiledSteps = [];
    steps.forEach((entry) => {
      var position = entry['position'];
      var step = entry['value'];
      // we copy this since for each timeline/element/duration
      // value there is a different combination of step timing
      // values and if we modify the existing step object then
      // that data will trickle over to the next time the same
      // timeline is used to create a new timeline session.
      var stepDetails = copyObj(step);

      stepDetails['offset'] = position > 1
          ? position / totalDuration // percentage-based
          : position;                // millisecond magnitude

      compiledSteps.push(stepDetails);
    });

    return compiledSteps.sort((a, b) => {
      return a.duration - b.duration;
    });
  }

  start() {
    if (!this._closingPromise) {
      this._closingPromise = new Promise((resolve) => {
        try {
          this._player = this._element.animate(this._steps, { duration: this._duration, fill: 'forwards' });
          this._player.onfinish = () => {
            //resolve();
          };
          this.resume();
        } catch(e) {
          console.log(this._element, e);
        }
      });
    }
    return this._closingPromise;
  }

  resume() {
    this._player.play();
  }

  pause() {
    this._player.pause();
  }

  reverse() {
    this._player.reverse();
  }

  snap() {
    if (this._player.currentTime > (this._duration / 2)) {
      this._player.reverse();
    }
    this.resume();
  }

  goTo(percentage) {
    this.pause();
    var time = percentage <= 1
        ? percentage * this._duration
        : percentage;
    this._player.currentTime = time;
  }
}

class AnimationPlayhead {
  private _playing = false;
  private _player;
  private _duration;
  private _resolve;
  private _reject;
  private _promise;

  constructor(private _driver, private _element, private _steps, private _playheads) { }

  pause() {
    if (this._playing) {
      this._playing = false;
      this._playheads.forEach((ph) => ph.pause());
    }
  }

  resume() {
    if (!this._playing) {
      this._playing = true;
      this._playheads.forEach((ph) => ph.resume());
    }
  }

  snap() {
    this._player.snap();
    this._playheads.forEach((ph) => ph.snap());
  }

  start(duration) {
    if (!this._player) {
      this._player = this._driver.create(this._element, this._steps, duration);
      this._player.start().then(this._onComplete);
      this._duration = duration;

      this._playing = true;
      this._playheads.forEach((ph) => ph.start(duration));
    }
  }

  progress(stepValue) {
    this.track(stepValue * this._duration);
  }

  track(stepValue) {
    this.pause();
    this._goTo(stepValue);

    this._playheads.forEach((ph) => ph.progress(stepValue));
  }

  _goTo(stepValue) {
    this._player.goTo(stepValue);
  }

  _onComplete() {
    if (this._resolve) {
      this._resolve();
    }
  }

  _getPromise() {
    if (!this._promise) {
      this._promise = new Promise((resolve, reject) => {
        this._resolve = resolve;
        this._reject = reject;
      });
    }
    return this._promise;
  }

  then(cb, er = null) {
    return this._getPromise()(cb, er);
  }
}

export class AnimationTimeline {

  private _steps = [];
  private _scopes = {};
  private _elements = new Map<HTMLElement, AnimationTimeline>();

  constructor(private _driver) {}

  fork() {
    return new AnimationTimeline(this._driver);
  }

  stepTo(position, duration, value) {
    if (this._steps.length) {
      var previous = this._steps[this._steps.length - 1];
      if (previous['position'] != position) {
        this.step(position, previous['value']);
      }
      this.step(position + duration, value);
    } else {
      this.step(position + duration, value);
    }
  }

  step(position, value) {
    this._steps.push({
      position:position,
      value:value
    });
    return this;
  }

  scopeElementTimeline(elm) {
    var timeline = this._elements.get(elm);
    if (!timeline) {
      timeline = this.fork();
      this._elements.set(elm, timeline);
    }
    return timeline;
  }

  scope(selector, timeline: AnimationTimeline) {
    this._scopes[selector] = timeline;
  }

  _finalizeSteps() {
    var finalValues = {};
    this._steps.forEach((step) => {
      for (var i in step.value) {
        finalValues[i] = step.value[i];
      }
    });
    this.step(1, finalValues);
  }

  create(container) {
    this._finalizeSteps();

    var playheads = [];
    for (var selector in this._scopes) {
      let timeline = this._scopes[selector];
      let elements = container.querySelectorAll(selector);
      for (var i = 0; i < elements.length; i++) {
        playheads.push(timeline.create(elements[i]));
      }
    }

    this._elements.forEach((timeline, elm) => {
      playheads.push(timeline.create(elm));
    });

    return new AnimationPlayhead(this._driver, container, this._steps, playheads);
  }
}
