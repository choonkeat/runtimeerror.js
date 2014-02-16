var fs = require('fs');
var bugsnag = require('../../lib/http/bugsnag');

describe('bugsnag', function() {
  describe('simplify_stacktrace', function() {
    var payload = JSON.parse(fs.readFileSync("samples/bugsnag.sample.json"));
    it("should replace stacktrace hash with array of strings", function() {
      expect(typeof payload.events[0].exceptions[0].stacktrace[0]).toBe('object');
      bugsnag.simplify_stacktrace(payload)
      expect(typeof payload.events[0].exceptions[0].stacktrace[0]).toBe('string');
    });
  });
});
