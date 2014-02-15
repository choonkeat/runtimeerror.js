var fs = require('fs');
var url = require('url');
var zlib = require('zlib');
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

var static_directory = new node_static.Server(path.join(__dirname, 'public'));
var server = http.createServer();
fs.readdir('./lib/http', function(err, files) {
  var backends = lodash.map(files, function(f) { return require('./lib/http/' + f); })
  server.addListener('request', function(req, res) {
    if (req.method == 'GET' && (req.url == '/' || req.url == '/favicon.ico')) {
      if (process.env.HIDE_UPLOAD_FORM) {
        res.writeHead(200, {'content-type': 'text/plain'});
        res.end();
      } else {
        static_directory.serve(req, res);
      }

    } else {
      console.log(req.method, req.url);
      var pending = backends.length;
      lodash.forEach(backends, function(backend) {
        backend.handle(req, res, function(err, data) {
          console.log(pending, err, data);
          pending -= 1;
          if (err) {
            if (pending == 0) {
              console.log('exhausted, non succeeded');
              res.writeHead(412, {'content-type': 'text/plain'});
              res.write(invalid_eml_message);
              res.end();
            }
          } else if (pending >= 0) {
            pending = -1; // ignore other backends
            console.log('success', data);
            res.writeHead(200, {'content-type': 'text/plain'});
            if (data) res.write(data);
            res.end();
          }
        });
      });
    }
  });
});

var port = process.env.PORT || 3000;
console.log(' [*] Listening on 0.0.0.0:' + port);
server.listen(port, '0.0.0.0');
