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
        if (!(payload && payload.access_token && payload.data)) return callback('Rollbar');
        if ((typeof payload.data.length) == 'undefined') payload.data = [payload.data];
        lodash.forEach(payload.data, function(item) {
          console.log(item, item.notifier);
          if (item.notifier && item.notifier.name.match('rollbar')) {
            if (item.body && item.body.trace && item.body.trace.exception) {
              var title = [item.body.trace.exception.class, item.body.trace.exception.message].join(': ');
              var last_frame = null;
              var stacktrace = lodash.map(item.body.trace.frames, function(frame) {
                last_frame = frame;
                return ["at", frame.method, ['(', frame.filename, (frame.lineno && ':'), frame.lineno, (frame.colno && ':'), frame.colno, ')'].join('')].join(' ');
              });
              var body = '## Stacktrace\n```\n' + stacktrace.reverse().join("\n") + "\n```\n## Details\n```\n" + JSON.stringify(item, null, 2) + "\n```\n";
              if (last_frame && last_frame.context && last_frame.context.pre) {
                body = ['## Code\n```', last_frame.context.pre.join("\n"), last_frame.code, last_frame.context.post.join("\n"), '```'].join("\n") + "\n" + body;
              }
              var to_account = runtimeerror.extract_repo_secret_provider(payload.access_token);
              if (to_account) {
                var account = new Account(to_account);
                runtimeerror.handle(account, title, body, function(err) {
                  callback(err, err ? null : JSON.stringify({"result": []}));
                })
                success = true;
              }
            } else if (item.body && item.body.message) {
              var body = "\n``` json\n" + JSON.stringify(item.body.message, null, 2) + "\n```\n";
              var to_account = runtimeerror.extract_repo_secret_provider(payload.access_token);
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
