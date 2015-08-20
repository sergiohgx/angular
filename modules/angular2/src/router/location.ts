import {LocationStrategy} from './location_strategy';
import {LocationUrl} from './location_url';
import {StringWrapper, isPresent, CONST_EXPR} from 'angular2/src/core/facade/lang';
import {BaseException, isBlank} from 'angular2/src/core/facade/lang';
import {OpaqueToken, Injectable, Optional, Inject} from 'angular2/di';

export const APP_BASE_HREF: OpaqueToken = CONST_EXPR(new OpaqueToken('appBaseHref'));

/**
 * This is the service that an application developer will directly interact with.
 *
 * Responsible for normalizing the URL against the application's base href.
 * A normalized URL is absolute from the URL host, includes the application's base href, and has no
 * trailing slash:
 * - `/my/app/user/123` is normalized
 * - `my/app/user/123` **is not** normalized
 * - `/my/app/user/123/` **is not** normalized
 */
@Injectable()
export class Location {
  private _baseHref: string;
  private _subscribeFn: Function = () => {};
  private _cachedPath: string;

  constructor(private _platformStrategy: LocationStrategy, private _locationUrl: LocationUrl,
              @Optional() @Inject(APP_BASE_HREF) href?: string) {
    if (isPresent(href)) {
      this._baseHref = isPresent(href) ? href : null;
    } else {
      this._locationUrl.getBaseHref().then((baseHref) => {
        if (isBlank(baseHref)) {
          throw new BaseException(
              `No base href set. Either provide a binding to "appBaseHrefToken" or add a base element.`);
        }
      });
    }

    this._locationUrl.onPopState((args) => {
      var finalUrl = this._platformStrategy.parseUrl(args["url"]);
      this._subscribeFn({"url": this._registerPath(finalUrl), 'pop': true});
    });
  }

  _registerPath(path: string): string { return this._cachedPath = this.normalize(path); }

  path(): string { return this._cachedPath; }

  normalize(url: string): string { return stripTrailingSlash(stripIndexHtml(url)); }

  normalizeAbsolutely(url: string): string {
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    return stripTrailingSlash(url);
  }

  go(url: string): void {
    var finalUrl = this.normalizeAbsolutely(url);
    this._registerPath(finalUrl);
    this._locationUrl.setUrl(this._platformStrategy.prepareUrl(finalUrl), this._baseHref);
  }

  forward(): void { this._locationUrl.forward(); }

  back(): void { this._locationUrl.back(); }

  subscribe(onNext: (value: any) => void, onThrow: (exception: any) => void = null,
            onReturn: () => void = null): void {
    // TODO (matsko): figure out support for onThrow, onReturn
    this._subscribeFn = onNext;
  }
}


function stripIndexHtml(url: string): string {
  if (/\/index.html$/g.test(url)) {
    // '/index.html'.length == 11
    return url.substring(0, url.length - 11);
  }
  return url;
}

function stripTrailingSlash(url: string): string {
  if (/\/$/g.test(url)) {
    url = url.substring(0, url.length - 1);
  }
  return url;
}
