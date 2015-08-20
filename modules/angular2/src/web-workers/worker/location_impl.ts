import {Injectable} from 'angular2/di';
import {Promise, ObservableWrapper} from 'angular2/src/core/facade/async';
import {Type} from 'angular2/src/core/facade/lang';
import {
  FnArg,
  UiArguments,
  ClientMessageBroker,
  ClientMessageBrokerFactory
} from 'angular2/src/web_workers/shared/client_message_broker';
import {MessageBus} from 'angular2/src/web_workers/shared/message_bus';
import {
  LOCATION_CHANNEL,
  LOCATION_CHANGE_CHANNEL
} from 'angular2/src/web_workers/shared/messaging_api';
import {LocationUrlInterface} from 'angular2/src/router/location_url';

/**
 * Implementation of render/xhr that relays location requests to the UI side where they are sent
 * and the result is proxied back to the worker
 */
@Injectable()
export class WorkerLocationUrl implements LocationUrlInterface {
  private _messageBroker: ClientMessageBroker;

  constructor(messageBrokerFactory: ClientMessageBrokerFactory, private _messageBus: MessageBus) {
    this._messageBroker = messageBrokerFactory.createMessageBroker(LOCATION_CHANNEL);
  }

  _messageUi(args: UiArguments, returnType: Type): Promise<any> {
    return this._messageBroker.runOnUiThread(args, returnType);
  }

  _messageUiCommand(command: string): Promise<any> {
    var args: UiArguments = new UiArguments(command, null);
    return this._messageUi(args, null);
  }

  setUrl(url: string, baseHref: string): void {
    var fnArgs: List<FnArg> = [new FnArg(url, String), new FnArg(baseHref, String)];
    var args: UiArguments = new UiArguments("setUrl", fnArgs);
    this._messageUi(args, null);
  }

  onPopState(fn: (_: any) => any): void {
    ObservableWrapper.subscribe(this._messageBus.from(LOCATION_CHANGE_CHANNEL),
                                (message: StringMap<string, any>) => fn(message["url"]));
  }

  getBaseHref(): Promise<string> {
    var args: UiArguments = new UiArguments("getBaseHref", null);
    return this._messageUi(args, String);
  }

  getUrl(): Promise<string> {
    var args: UiArguments = new UiArguments("getUrl", null);
    return this._messageUi(args, String);
  }

  forward(): void { this._messageUiCommand("forward"); }

  back(): void { this._messageUiCommand("back"); }
}
