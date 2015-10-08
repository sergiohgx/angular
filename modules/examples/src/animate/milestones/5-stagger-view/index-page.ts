import {Component, View, Injectable, CORE_DIRECTIVES} from 'angular2/angular2';
import {SpecialTitlePipe} from './special-title-pipe';
import {DbService} from './db_service';
import {PageLink} from './page_link';

@Component({
  selector: 'index-page-cmp',
  viewBindings: [DbService]
})
@View({
  templateUrl: 'index-page.html',
  directives: [CORE_DIRECTIVES, PageLink],
  pipes: [SpecialTitlePipe]
})
export class IndexPageCmp {
  constructor(private _db: DbService) {}

  get specialUsers() {
    return this.users.slice(0,5);
  }

  get users() {
    return this._db.users();
  }
}
