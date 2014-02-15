var fs = require('fs');
var url = require('url');
var lodash = require('lodash');
var querystring = require('querystring');
var formidable = require('formidable');
var MailParser = require("mailparser").MailParser;
var runtimeerror = require('../runtimeerror');
var Account = require('../account').Account;

module.exports = {
  handle: function(req, res, callback) {
    if (req.method != 'POST') return callback('rtejs');
    var success = false;
    var uri = url.parse(req.url, !!'true:query as object');
    var content_type = (req.headers && req.headers['content-type'] || "");

    var mailparser = new MailParser();
    mailparser.on("end", function(mail_object) {
      title = mail_object.subject;
      body = mail_object.html || mail_object.text;
      if (! (title && body)) return callback('rtejs');
      var reply_to, to_account;
      lodash.find([].concat(mail_object.inReplyTo || []).concat(mail_object.references || []), function(messageId) {
        reply_to = runtimeerror.extract_repo_number_provider_secret(messageId);
        return reply_to;
      });
      if (reply_to) {
        console.log("reply_to", reply_to);
        var account = new Account(reply_to);
        account.api.comment_issue(reply_to.number, { body: mail_object.html || mail_object.text }, function(err) {
          callback(err, null);
        });
      } else if (to_account = runtimeerror.extract_repo_secret_provider(mail_object.headers.to)) {
        console.log("to_account", to_account);
        var account = new Account(to_account);
        runtimeerror.handle(account, title, body, function(err) {
          callback(err, null);
        });
      } else {
        console.log("Unknown", { to: mail_object.headers.to, ref: mail_object.references, inReplyTo: mail_object.inReplyTo });
        callback('rtejs');
      }
    });

    if (content_type.match(/multipart\/form/i)) {
      var form = new formidable.IncomingForm();
      form.encoding = 'utf-8';
      form.on('field', function(name, value) {
        if (name != 'message') return;
        success = true;
        form.removeAllListeners('end');
        mailparser.write(uri.message);
        mailparser.end();
      });
      form.on('file', function(name, file) {
        if (name != 'message') return;
        success = true;
        form.removeAllListeners('end');
        fs.createReadStream(file.path).pipe(mailparser);
      });
      form.on('end', function() { if (!success) callback('rtejs'); });
      form.parse(req);

    } else if (content_type.match(/www-form-urlencoded/i)) {
      var chunks = [];
      req.on('data', chunks.push.bind(chunks));
      req.on('end', function() {
        var body = chunks.join("").toString();
        uri = querystring.parse(body);
        mailparser.write(uri.message);
        mailparser.end();
      });

    } else {
      callback('rtejs');
    }
  }
}
