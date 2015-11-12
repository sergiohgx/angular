import {AnimationContext} from 'angular2/src/animate/ui/animation_element';

export interface AnimationHelper {
  process(element: HTMLElement, styles: {[key: string]: string}, context: AnimationContext): any;

}
