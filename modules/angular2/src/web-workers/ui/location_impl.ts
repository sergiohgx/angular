import {Injectable} from 'angular2/di';
import {MessageBus} from 'angular2/src/web_workers/shared/message_bus';
import {
  EventEmitter,
  ObservableWrapper,
  PromiseWrapper,
  Promise
} from 'angular2/src/core/facade/async';
import {
  LOCATION_CHANNEL,
  LOCATION_CHANGE_CHANNEL
} from 'angular2/src/web_workers/shared/messaging_api';
import {bind} from 'angular2/src/web_workers/ui/bind';
import {LocationUrl} from 'angular2/src/router/location_url';
import {ServiceMessageBrokerFactory} from 'angular2/src/web_workers/shared/service_message_broker';
import {PRIMITIVE} from 'angular2/src/web_workers/shared/serializer';

@Injectable()
export class MessageBasedLocationImpl {
  constructor(private _bus: MessageBus, brokerFactory: ServiceMessageBrokerFactory,
              private _locationUrl: LocationUrl) {
    var bindToLocation = (method) => { return bind(method, this._locationUrl); };

    var broker = brokerFactory.createMessageBroker(LOCATION_CHANNEL);

    broker.registerMethod("setUrl", [PRIMITIVE, PRIMITIVE],
                          bindToLocation(this._locationUrl.setUrl));
    broker.registerMethod("getUrl", null, bindToLocation(this._locationUrl.getUrl), PRIMITIVE);
    broker.registerMethod("back", null, bindToLocation(this._locationUrl.back));
    broker.registerMethod("forward", null, bindToLocation(this._locationUrl.forward));
    broker.registerMethod("getBaseHref", null, bindToLocation(this._locationUrl.getBaseHref),
                          PRIMITIVE);

    this._locationUrl.onPopState((_) => this._handlePopState(_));
  }

  private _handlePopState(_) {
    this._locationUrl.getUrl().then((url) => {
      ObservableWrapper.callNext(this._bus.to(LOCATION_CHANGE_CHANNEL), {"url": url});
    });
  }
}
