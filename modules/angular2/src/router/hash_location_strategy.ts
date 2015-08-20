import {LocationStrategy} from './location_strategy';
import {Injectable} from 'angular2/di';

@Injectable()
export class HashLocationStrategy extends LocationStrategy {
  prepareUrl(url: string): string { return '#' + url; }

  parseUrl(url: string): string {
    // Dart will complain if a call to substring is
    // executed with a position value that extends the
    // length of string.
    return url.length > 0 ? url.substring(1) : url;
  }
}
