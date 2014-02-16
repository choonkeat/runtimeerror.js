var zlib = require('zlib');
var url = require('url');
var lodash = require('lodash');
var runtimeerror = require('../runtimeerror');
var Account = require('../account').Account;

module.exports = {
  simplify_stacktrace: function(payload) {
    if (payload.data && typeof(payload.data.length) == 'undefined') payload.data = [payload.data];
    lodash.forEach(payload.data, function(d) {
      if (d.body && d.body.trace && d.body.trace.frames) {
        d.body.trace.frames = lodash.map(d.body.trace.frames, function(obj) {
          return [[obj.filename, obj.lineno, obj.colno].join(':'), ['in `', obj.method, "'"].join("")].join(' ');
        });
      }
    });
  },
  handle: function(req, res, callback) {
    var rollbar = this;
    var chunks = [];
    req.on('data', chunks.push.bind(chunks));
    req.on('end', function() {
      var success = false;
      try {
        var payload = JSON.parse(chunks.join("").toString());
        if (!(payload && payload.access_token && payload.data)) return callback('Rollbar');
        var access_token = payload.access_token;
        delete payload.access_token; // remove known secrets
        if ((typeof payload.data.length) == 'undefined') payload.data = [payload.data];
        rollbar.simplify_stacktrace(payload);
        lodash.forEach(payload.data, function(item) {
          console.log('item', item, item.notifier);
          if (item.notifier && item.notifier.name.match('rollbar')) {
            if (item.body && item.body.trace && item.body.trace.exception) {
              var title = [item.body.trace.exception.class, item.body.trace.exception.message].join(': ');
              var to_account = runtimeerror.extract_repo_secret_provider(access_token);
              if (to_account) {
                var account = new Account(to_account);
                runtimeerror.handle(account, title, runtimeerror.json2htmltables(payload), function(err) {
                  callback(err, err ? null : JSON.stringify({"result": []}));
                })
                success = true;
              }
            } else if (item.body && item.body.message) {
              var body = "\n``` json\n" + JSON.stringify(item.body.message, null, 2) + "\n```\n";
              var to_account = runtimeerror.extract_repo_secret_provider(access_token);
              if (to_account) {
                var account = new Account(to_account);
                runtimeerror.handle(account, item.body.message.body || JSON.stringify(item.body.message), body, function(err) {
                  callback(err, err ? null : JSON.stringify({"result": []}));
                })
                success = true;
              }
            }
          }
        });
      } catch (err) {
        // ignore
      }
      if (!success) callback('Rollbar');
    });
  }
}
