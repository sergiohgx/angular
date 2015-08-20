import {BaseException} from 'angular2/src/core/facade/lang';
import {Injectable} from 'angular2/di';

function _abstract() {
  return new BaseException('This method is abstract');
}

@Injectable()
export class LocationStrategy {
  prepareUrl(url: string): string { throw _abstract(); }
  parseUrl(url: string): string { throw _abstract(); }
}
