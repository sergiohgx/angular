import {ElementRef, Directive, Component, Injectable, CORE_DIRECTIVES, View} from 'angular2/angular2';

import './animations';

@Component({
  selector: 'animate-app'
})
@View({
  templateUrl: 'app.html',
  directives: [CORE_DIRECTIVES]
})
export class AnimateAppCmp {
  public pageIsActive = false;

  public dragging(event) {}

  public authors = [
    {name:'igor'   , image:"./images/igor.png"}   ,
    {name:'carmen' , image:"./images/carmen.png"} ,
    {name:'naomi'  , image:"./images/naomi.png"}  ,
    {name:'rado'   , image:"./images/rado.png"}   ,
    {name:'thomas' , image:"./images/thomas.png"} ,
    {name:'tobias' , image:"./images/tobias.png"} ,
    {name:'brad'   , image:"./images/brad.png"}   ,
    {name:'scott'  , image:"./images/scott.png"}  ,
    {name:'kara'   , image:"./images/kara.png"}   ,
    {name:'lukas'   , image:"./images/lukas.png"}   ,
  ]
}
