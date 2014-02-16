var fs = require('fs');
var rollbar = require('../../lib/http/rollbar');

describe('rollbar', function() {
  describe('simplify_stacktrace', function() {
    describe("json with 'trace'", function() {
      var payload = JSON.parse(fs.readFileSync("samples/rollbar.sample" + Math.floor(Math.random() * 3) + ".json"));
      it("should change trace.frames into array of string", function() {
        expect(typeof (payload.data[0] || payload.data).body.trace.frames[0]).toBe('object');
        rollbar.simplify_stacktrace(payload)
        expect(typeof payload.data[0].body.trace.frames[0]).toBe('string');
      });
    });
    describe("json without 'trace'", function() {
      var payload = JSON.parse(fs.readFileSync("samples/rollbar.sample3.json"));
      it("should not change", function() {
        expect(typeof payload.data[0].body.trace).toBe('undefined');
        rollbar.simplify_stacktrace(payload)
        expect(typeof payload.data[0].body.trace).toBe('undefined');
      });
    });
  });
});
