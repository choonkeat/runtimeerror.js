var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
var utils = require('util');
var lodash = require('lodash');
var querystring = require('querystring');
var node_static = require('node-static');
var formidable = require('formidable');
var provider = require('./providers/' + (process.env.PROVIDER || 'github'));
var runtimeerror = require('./runtimeerror');
var MailParser = require("mailparser").MailParser;
var invalid_eml_message = 'Please upload a valid email file as "message" form field';

var create_mailparser = function(res, callback) {
  var mailparser = new MailParser();
  mailparser.on("end", function(mail_object) {
    title = mail_object.subject;
    body = mail_object.html || mail_object.text;
    if (! (title && body)) return callback(invalid_eml_message);
    runtimeerror.handle(provider, title, body, callback);
    callback();
  });
  return mailparser;
}

var static_directory = new node_static.Server(path.join(__dirname, 'public'));
var server = http.createServer();
server.addListener('request', function(req, res) {
  var callback = function(err) {
    if (err) console.error(err);
    res.writeHead((err ? 412 : 200), {'content-type': 'text/plain'});
    res.write(err ? err.toString() : "Okay");
    res.end();
  }
  var mailparser = create_mailparser(res, callback);
  var uri = url.parse(req.url, !!'true:query as object');
  if (req.method == 'POST') {
    if (req.headers && req.headers['content-type'].toString().match(/multipart\/form/i)) {
      var form = new formidable.IncomingForm();
      form.encoding = 'utf-8';
      form.on('file', function(name, file) {
        if (name != 'message') return;
        form.removeAllListeners('end');
        fs.createReadStream(file.path).pipe(mailparser);
      });
      form.on('end', function() { callback(invalid_eml_message); });
      form.parse(req);

    } else if (req.headers && req.headers['content-type'].toString().match(/www-form-urlencoded/i)) {
      var chunks = [];
      req.on('data', chunks.push.bind(chunks));
      req.on('end', function() {
        uri = querystring.parse(chunks.join("").toString());
        mailparser.write(uri.message);
        mailparser.end();
      });

    } else if (req.headers && req.headers['content-type'].toString().match(/application\/json/i)) {
      var chunks = [];
      req.on('data', chunks.push.bind(chunks));
      req.on('end', function() {
        try {
          var payload = JSON.parse(chunks.join("").toString());
          if (payload && payload.notifier && (payload.notifier.url || "").match('bugsnag')) {
            lodash.forEach(payload.events, function(event) {
              lodash.forEach(event.exceptions, function(ex) {
                runtimeerror.handle(provider, ex.message, "``` json\n" + JSON.stringify(ex, null, 2) + "\n```\n", callback);
              });
            });
          } else if (payload && payload.access_token && payload.data) {
            lodash.forEach(payload.data, function(item) {
              if (item.notifier && item.notifier.name.match('rollbar')) {
                if (item.body && item.body.trace && item.body.trace.exception) {
                  var title = [item.body.trace.exception.class, item.body.trace.exception.message].join(': ');
                  var last_frame = null;
                  var stacktrace = lodash.map(item.body.trace.frames, function(frame) {
                    last_frame = frame;
                    return ["at", frame.method, ['(', frame.filename, ':', frame.lineno, ':', frame.colno].join('')].join(' ');
                  });
                  var body = '## Stacktrace\n```\n' + stacktrace.reverse().join("\n") + "\n```\n## Details\n```\n" + JSON.stringify(item, null, 2) + "\n```\n";
                  if (last_frame && last_frame.context && last_frame.context.pre) {
                    body = ['## Code\n```', last_frame.context.pre.join("\n"), last_frame.code, last_frame.context.post.join("\n"), '```'].join("\n") + "\n" + body;
                  }
                  runtimeerror.handle(provider, title, body, callback);
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
      callback(invalid_eml_message);
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
