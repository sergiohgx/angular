import {LocationStrategy} from './location_strategy';
import {Injectable} from 'angular2/di';

@Injectable()
export class PathLocationStrategy extends LocationStrategy {
  prepareUrl(url: string): string { return url; }
  parseUrl(url: string): string { return url; }
}
