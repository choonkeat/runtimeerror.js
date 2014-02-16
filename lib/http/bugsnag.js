var zlib = require('zlib');
var url = require('url');
var lodash = require('lodash');
var runtimeerror = require('../runtimeerror');
var Account = require('../account').Account;

module.exports = {
  handle: function(req, res, callback) {
    var chunks = [];
    req.on('data', chunks.push.bind(chunks));
    req.on('end', function() {
      var success = false;
      try {
        var payload = JSON.parse(chunks.join("").toString());
        if (payload && payload.notifier && (payload.notifier.url || "").match('bugsnag')) {
          lodash.forEach(payload.events, function(event) {
            lodash.forEach(event.exceptions, function(ex) {
              var to_account = runtimeerror.extract_repo_secret_provider(payload.apiKey)
              if (to_account) {
                var account = new Account(to_account);
                runtimeerror.handle(account, ex.message, runtimeerror.json2markdown(ex), function(err) {
                  callback(err, null);
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
