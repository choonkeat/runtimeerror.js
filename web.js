var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
var utils = require('util');
var lodash = require('lodash');
var querystring = require('querystring');
var node_static = require('node-static');
var formidable = require('formidable');
var MailParser = require("mailparser").MailParser;
var invalid_eml_message = 'Please upload a valid email file as "message" form field';

var runtimeerror = require('./lib/runtimeerror');
var Account = require('./lib/account').Account;

var create_mailparser = function(res, callback) {
  var mailparser = new MailParser();
  mailparser.on("end", function(mail_object) {
    title = mail_object.subject;
    body = mail_object.html || mail_object.text;
    if (! (title && body)) return callback(invalid_eml_message);
    var reply_to;
    lodash.find(mail_object.references, function(messageId) {
      reply_to = runtimeerror.extract_repo_number_provider_secret(messageId);
      return reply_to;
    });
    var to_account = runtimeerror.extract_repo_secret_provider(mail_object.headers.to);
    if (reply_to) {
      console.log("reply_to", reply_to);
      var account = new Account(reply_to);
      account.api.comment_issue(reply_to.number, { body: mail_object.html || mail_object.text }, callback);
    } else if (to_account) {
      console.log("to_account", to_account);
      var account = new Account(to_account);
      runtimeerror.handle(account, title, body, callback);
    } else {
      console.log("Unknown", { to: mail_object.headers.to, ref: mail_object.references });
      callback('Unknown');
    }
  });
  return mailparser;
}

var static_directory = new node_static.Server(path.join(__dirname, 'public'));
var server = http.createServer();
server.addListener('request', function(req, res) {
  var callback = function(err) {
    if (err) console.error(err);
    res.writeHead((err ? 412 : 200), {'content-type': 'text/plain'});
    res.write(err ? err.toString() : JSON.stringify({"result": []}));
    res.end();
  }
  var mailparser = create_mailparser(res, callback);
  var uri = url.parse(req.url, !!'true:query as object');
  if (req.method == 'POST') {
    var content_type = (req.headers && req.headers['content-type'] || "");
    var content_length = +(req.headers && req.headers['content-length'] || 0);
    if (content_type.match(/multipart\/form/i)) {
      var form = new formidable.IncomingForm();
      form.encoding = 'utf-8';
      form.on('field', function(name, value) {
        if (name != 'message') return;
        form.removeAllListeners('end');
        mailparser.write(uri.message);
        mailparser.end();
      });
      form.on('file', function(name, file) {
        if (name != 'message') return;
        form.removeAllListeners('end');
        fs.createReadStream(file.path).pipe(mailparser);
      });
      form.on('end', function() { callback(invalid_eml_message); });
      form.parse(req);

    } else if (content_type.match(/www-form-urlencoded/i)) {
      var chunks = [];
      req.on('data', chunks.push.bind(chunks));
      req.on('end', function() {
        uri = querystring.parse(chunks.join("").toString());
        mailparser.write(uri.message);
        mailparser.end();
      });

    } else if ((content_type.match(/application\/json/i)) || (content_length > 0)) {
      var chunks = [];
      req.on('data', chunks.push.bind(chunks));
      req.on('end', function() {
        try {
          var payload = JSON.parse(chunks.join("").toString());
          if (payload && payload.notifier && (payload.notifier.url || "").match('bugsnag')) {
            lodash.forEach(payload.events, function(event) {
              lodash.forEach(event.exceptions, function(ex) {
                var to_account = runtimeerror.extract_repo_secret_provider(payload.apiKey)
                if (to_account) {
                  var account = new Account(to_account);
                  runtimeerror.handle(account, ex.message, "``` json\n" + JSON.stringify(ex, null, 2) + "\n```\n", callback);
                } else {
                  callback(' ');
                }
              });
            });
          } else if (payload && payload.access_token && payload.data) {
            if ((typeof payload.data.length) == 'undefined') payload.data = [payload.data];
            lodash.forEach(payload.data, function(item) {
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
                    runtimeerror.handle(account, title, body, callback);
                  } else {
                    callback('Unknown');
                  }
                } else if (item.body && item.body.message) {
                  var body = "\n``` json\n" + JSON.stringify(item.body.message, null, 2) + "\n```\n";
                  var to_account = runtimeerror.extract_repo_secret_provider(payload.access_token);
                  if (to_account) {
                    var account = new Account(to_account);
                    runtimeerror.handle(account, item.body.message.body || JSON.stringify(item.body.message), body, callback);
                  } else {
                    callback('Unknown');
                  }
                }
              }
            });
          }
          callback();
        } catch (err) {
          callback(err);
        }
      });
    } else {
      var chunks = [];
      req.on('data', chunks.push.bind(chunks));
      req.on('end', function() {
        console.log('unknown body:', chunks.join('').toString());
        callback(invalid_eml_message);
      })
    }
  } else if (process.env.HIDE_UPLOAD_FORM) {
    callback(" ");
  } else {
    static_directory.serve(req, res);
  }
});

var port = process.env.PORT || 3000;
console.log(' [*] Listening on 0.0.0.0:' + port);
server.listen(port, '0.0.0.0');
