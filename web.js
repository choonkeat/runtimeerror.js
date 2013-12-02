var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
var utils = require('util');
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
    res.writeHead((err ? 412 : 200), {'content-type': 'text/plain'});
    res.write(err || "Okay");
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

    } else {
      callback(invalid_eml_message);
    }
  } else {
    static_directory.serve(req, res);
  }
});

var port = process.env.PORT || 3000;
console.log(' [*] Listening on 0.0.0.0:' + port);
server.listen(port, '0.0.0.0');
