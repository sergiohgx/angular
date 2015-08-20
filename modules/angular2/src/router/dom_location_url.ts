import {DOM} from 'angular2/src/core/dom/dom_adapter';
import {PromiseWrapper, Promise} from 'angular2/src/core/facade/async';
import {LocationUrlInterface} from 'angular2/src/router/location_url';
import {Injectable} from 'angular2/di';
import {isPresent} from 'angular2/src/core/facade/lang';

@Injectable()
export class DomLocationUrl implements LocationUrlInterface {
  private _location: Location;
  private _history: History;
  private _baseHref: string;

  constructor() {
    this._location = DOM.getLocation();
    this._history = DOM.getHistory();
    this._baseHref = DOM.getBaseHref();
  }

  getUrl(): Promise<string> {
    return PromiseWrapper.wrap(() => this._stripBaseHref(this._location.pathname));
  }

  setUrl(url: string, baseHref: string): void {
    var finalUrl: string = this._addBaseHref(url, baseHref);
    this._history.pushState(null, '', finalUrl);
  }

  back() { this._history.back(); }

  forward() { this._history.forward(); }

  getBaseHref(): Promise<string> { return PromiseWrapper.wrap(() => this._baseHref); }

  onPopState(onNext: (value: any) => void): void {
    DOM.getGlobalEventTarget('window')
        .addEventListener('popstate', () => { onNext({"url": this._location.pathname}); }, false);
  }

  _stripBaseHref(url: string): string {
    if (this._baseHref.length > 0 && url.startsWith(this._baseHref)) {
      return url.substring(this._baseHref.length);
    }
    return url;
  }

  _addBaseHref(url: string, baseHref: string): string {
    baseHref = isPresent(baseHref) ? baseHref : this._baseHref;
    if (!url.startsWith(baseHref)) {
      return baseHref + url;
    }
    return url;
  }
}
