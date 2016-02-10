import {AnimationPlayer} from 'angular2/src/core/animation/animation_player';
import {Renderer} from 'angular2/src/core/render/api';

export interface AnimationFactory {
  createEnterAnimation(element: any, renderer: Renderer): AnimationPlayer;
  createLeaveAnimation(element: any, renderer: Renderer): AnimationPlayer;
  createAddClassAnimation(className: string, element: any, renderer: Renderer): AnimationPlayer;
  createRemoveClassAnimation(className: string, element: any, renderer: Renderer): AnimationPlayer;
  createRemoveAttributeAnimation(attrName: string, element: any,
                                 renderer: Renderer): AnimationPlayer;
  createSetAttributeAnimation(attrName: string, attrValue: string, element: any,
                              renderer: Renderer): AnimationPlayer;
}
