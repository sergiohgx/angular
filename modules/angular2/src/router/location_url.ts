import {Promise} from 'angular2/src/core/facade/async';
import {BaseException} from 'angular2/src/core/facade/lang';
import {Injectable} from 'angular2/di';

function _abstract() {
  return new BaseException('This method is abstract');
}

// TODO (matsko): remove this garbage once real abstract classes are available in TS (issue #3741)
export interface LocationUrlInterface {
  getUrl(): Promise<string>;
  setUrl(url: string, baseHref: string): void;
  back(): void;
  forward(): void;
  getBaseHref(): Promise<string>;
  onPopState(onNext: (value: any) => void): void;
}

@Injectable()
export class LocationUrl implements LocationUrlInterface {
  getUrl(): Promise<string> { throw _abstract(); }
  setUrl(url: string, baseHref: string): void { throw _abstract(); }
  back(): void { throw _abstract(); }
  forward(): void { throw _abstract(); }
  getBaseHref(): Promise<string> { throw _abstract(); }
  onPopState(onNext: (value: any) => void): void { throw _abstract(); }
}
