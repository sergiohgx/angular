export abstract class AnimationHelper {
  abstract pipe(element: HTMLElement, styles: {[key: string]: string}, context: any): any;
}
