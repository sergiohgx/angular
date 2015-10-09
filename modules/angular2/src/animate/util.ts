import {StringMapWrapper} from 'angular2/src/core/facade/collection';

export function mergeAnimationOptions(optionsA, optionsB, duration = null, delay = null) {
  var options = StringMapWrapper.merge(optionsA, optionsB);
  if (duration != null) {
    options['duration'] = duration;
  }
  if (delay != null) {
    options['delay'] = delay;
  }
  return options;
}

export function extractAndRemoveOption(object, key) {
  var value = object[key];
  delete object[key];
  return value;
}

export function parseTimingValue(value, name) {
  var convertedValue;
  switch (typeof value) {
    case "string":
      var lastChar = value[value.length - 1];
      if (lastChar == "s") {
        var secondLastChar = value[value.length - 2];
        if (secondLastChar == "m") { //ms
          convertedValue = parseInt(value.substring(0, value.length - 2), 10);
        } else {
          convertedValue = parseInt(value.substring(0, value.length - 1), 10) * 1000;
        }
      } else {
        error();
      }
      break;

    case "number":
      convertedValue = value;
      break;

    default: error();
  }

  return convertedValue;

  function error() {
    throw new Error("timing value for " + name + " must be in the format of: 10s, 10ms or 1000");
  }
}

export function suffixClasses(className, suffix) {
  if (className) {
    return className.split(' ').map((className) => className + suffix).join(' ');
  }
}

export function calculateCoordinates(element) {
  var props = element.getBoundingBox();
  var values = {};

  // these properties are traversed explicitely since
  // the bounding box object is lazy and each browser
  // reveals the properties differently...
  ['top','left','height','width'].forEach((prop) => {
    values[prop] = props[prop] + "px";
  });
  return values;
}

