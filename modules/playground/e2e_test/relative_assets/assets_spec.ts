import {verifyNoBrowserErrors} from 'angular2/src/testing/e2e_util';
import {Promise} from 'angular2/src/facade/async';

function waitForElement(selector) {
  var EC = (<any>protractor).ExpectedConditions;
  // Waits for the element with id 'abc' to be present on the dom.
  browser.wait(EC.presenceOf($(selector)), 20000);
}

describe('relative assets relative-app', () => {

  afterEach(verifyNoBrowserErrors);

  var URL = 'playground/src/relative_assets/';

  it('should load in the remote template relative to the cmp-one component', () => {
    browser.get(URL);

    waitForElement('cmp-one .inner-container');
    expect(element.all(by.css('cmp-one .inner-container')).count()).toEqual(1);
  });

  it('should load in the remote styleUrls relative to the cmp-one component', () => {
    browser.get(URL);

    waitForElement('cmp-one .inner-container');
    element(by.css('cmp-one .inner-container')).then((element) => {
      console.log(element);
    });
  });
});
