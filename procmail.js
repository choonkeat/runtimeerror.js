var runtimeerror = require('./lib/runtimeerror');
var Account = require('./lib/account').Account;
var lodash = require('lodash');

var MailParser = require("mailparser").MailParser,
    mailparser = new MailParser();
mailparser.on("end", function(mail_object) {
  var reply_to;
  lodash.find(mail_object.references, function(messageId) {
    reply_to = runtimeerror.extract_repo_number_provider_secret(messageId);
    return reply_to;
  });
  var to_account = runtimeerror.extract_repo_secret_provider(mail_object.headers.to);
  if (reply_to) {
    var account = new Account(reply_to);
    account.api.comment_issue(reply_to.number, { body: mail_object.html || mail_object.text }, function() { /* ok */ });
  } else if (to_account) {
    var account = new Account(to_account);
    runtimeerror.handle(account, mail_object.subject, mail_object.html || mail_object.text, function() { /* ok */ });
  }
});

process.stdin.setEncoding('utf8');
process.stdin.pipe(mailparser);
