import {ElementAnimationStyles} from 'angular2/src/animate/ui/element_animation_styles';

export class AnimationContext {
  triggerEvent: any;
  animationStyles: ElementAnimationStyles;
}

export class AnimationElement {
  element: HTMLElement;
  context: AnimationContext;
}
