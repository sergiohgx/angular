import * as dom_adapter from './src/dom/dom_adapter';
import * as browser_adapter from './src/browser/browser_adapter';

export namespace __platform_browser_private__ {
  export type DomAdapter = dom_adapter.DomAdapter;
  export var DomAdapter = dom_adapter.DomAdapter;

  export function getDOM(): DomAdapter { return dom_adapter.getDOM(); }

  export function setDOM(adapter: DomAdapter) { return dom_adapter.setDOM(adapter); }

  export var setRootDomAdapter = dom_adapter.setRootDomAdapter;

  export type BrowserDomAdapter = browser_adapter.BrowserDomAdapter;
  export var BrowserDomAdapter = browser_adapter.BrowserDomAdapter;
}
