import {PromiseWrapper, Promise} from 'angular2/src/core/facade/async';
import {EventEmitter, ObservableWrapper} from 'angular2/src/core/facade/async';
import {List} from 'angular2/src/core/facade/collection';
import {LocationUrl} from 'angular2/src/router/location_url';

export class MockLocationUrl implements LocationUrl {
  internalBaseHref: string = '/';
  internalPath: string = '/';
  internalTitle: string = '';
  urlChanges: List<string> = [];
  _subject: EventEmitter = new EventEmitter();

  simulatePopState(url: string): void {
    this.internalPath = url;
    ObservableWrapper.callNext(this._subject, {"url": url});
  }

  getUrl(): Promise<string> { return PromiseWrapper.wrap(() => this.internalPath); }

  simulateUrlPop(pathname: string): void {
    ObservableWrapper.callNext(this._subject, {'url': pathname});
  }

  setUrl(url: string, baseHref: string): void { this.pushState(null, '', url); }

  pushState(ctx: any, title: string, url: string): void {
    this.internalTitle = title;
    this.internalPath = url;
    this.urlChanges.push(url);
  }

  onPopState(fn: (value: any) => void): void { ObservableWrapper.subscribe(this._subject, fn); }

  getBaseHref(): Promise<string> { return PromiseWrapper.wrap(() => this.internalBaseHref); }

  back(): void {
    if (this.urlChanges.length > 0) {
      this.urlChanges.pop();
      var nextUrl = this.urlChanges.length > 0 ? this.urlChanges[this.urlChanges.length - 1] : '';
      this.simulatePopState(nextUrl);
    }
  }

  forward(): void {}
}
