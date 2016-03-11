import {AnimationPlayer} from 'angular2/src/animate/ui/animation_player';
import {StringMapWrapper} from 'angular2/src/facade/collection';

export class AnimationElement {
  public player: AnimationPlayer;
  public context: {[key: string]: any} = {};

  constructor(public element: HTMLElement,
              public eventName: string,
              public event: Event,
              data: {[key: string]: any}) {
    this.context['event'] = event;
    this.context['eventName'] = eventName;
    StringMapWrapper.forEach(data, (value, key) => {
      this.context[key] = value;
    });
  }

  // TODO (matsko): include the rest of the info
}
