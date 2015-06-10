import {verifyNoBrowserErrors} from 'angular2/src/test_lib/e2e_util';

describe('routing inbox-app', function() {

  afterEach(verifyNoBrowserErrors);

  describe('index page', function() {
    var URL = 'examples/src/routing/index.html';

    it('should list out the current collection of items', function() {
      browser.get(URL);
      expect(element.all(by.css('.inbox-item-record')).count()).toBeGreaterThan(1);
    });

    it('should build a link which points to the detail page', function() {
      browser.get(URL);
      element(by.css('#item-15')).click();
      expect(browser.getCurrentUrl()).toMatch(/\/detail\/15$/);
    });
  });

});
