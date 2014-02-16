var zlib = require('zlib');
var url = require('url');
var lodash = require('lodash');
var runtimeerror = require('../runtimeerror');
var Account = require('../account').Account;

module.exports = {
  simplify_stacktrace: function(payload) {
    lodash.forEach(payload.events, function(event) {
      lodash.forEach(event.exceptions, function(ex) {
        ex.stacktrace = lodash.map(ex.stacktrace, function(obj) {
          return [obj.inProject ? '[app]' : '[lib]', [obj.file, obj.lineNumber, obj.columnNumber].join(':'), ['in `', obj.method, "'"].join("")].join(' ');
        });
      });
    });
  },
  handle: function(req, res, callback) {
    var bugsnag = this;
    var chunks = [];
    req.on('data', chunks.push.bind(chunks));
    req.on('end', function() {
      var success = false;
      try {
        var payload = JSON.parse(chunks.join("").toString());
        if (payload && payload.notifier && (payload.notifier.url || "").match('bugsnag')) {
          var apiKey = payload.apiKey;
          delete payload.apiKey; // remove known secrets
          bugsnag.simplify_stacktrace(payload);
          lodash.forEach(payload.events, function(event) {
            lodash.forEach(event.exceptions, function(ex) {
              var to_account = runtimeerror.extract_repo_secret_provider(apiKey);
              if (to_account) {
                var account = new Account(to_account);
                runtimeerror.handle(account, ex.message, runtimeerror.json2htmltables(ex), function(err) {
                  callback(err, 'bugsnag');
                });
                success = true;
              }
            });
          });
        }
      } catch (err) {
        // ignore
      }
      if (!success) callback('bugsnag');
    });
  }
}
