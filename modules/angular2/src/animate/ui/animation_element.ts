import {AnimationPlayer} from 'angular2/src/animate/ui/animation_player';

export class AnimationElement {
  public player: AnimationPlayer;
  public context: {[key: string]: any} = {};

  constructor(public element: HTMLElement,
              public eventName: string,
              public event: Event) {
    this.context['event'] = event;
    this.context['eventName'] = eventName;
  }

  // TODO (matsko): include the rest of the info
}
