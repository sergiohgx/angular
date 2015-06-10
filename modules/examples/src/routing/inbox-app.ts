import {NgIf, NgFor, EventEmitter, Component, View, Inject} from 'angular2/angular2';
import {RouterLink, RouteConfig, Router, RouterOutlet} from 'angular2/router';
import {Http} from 'angular2/src/http/http';

@Component({
  selector: 'inbox-detail'
})
@View({
  templateUrl: "inbox-detail.html",
  directives: [NgFor, RouterLink]
})
class InboxDetailCmp {
  constructor() {
  }
}

@Component({
  selector: 'inbox'
})
@View({
  templateUrl: "inbox.html",
  directives: [NgFor, RouterLink]
})
class InboxCmp {
  constructor(http: Http, router: Router) {
    this.items = [];
    this.router = router;

    http('./db.json').forEach((resp) => {
      this.items = resp.json();
    })
  }
}

@Component({
  selector: 'inbox-app'
})
@View({
  // <a router-link=\"gamePage\" [router-params]=\"{'id':3}\">ddd</a>
  templateUrl: "inbox-app.html",
  directives: [RouterOutlet, RouterLink]
})
@RouteConfig([
  {path: '/detail/:id', component: InboxDetailCmp, as: 'detailPage'},
  {path: '/', component: InboxCmp}
])
export class InboxApp {
  router: Router;
  constructor(router: Router) {
    this.router = router;
  }
}
