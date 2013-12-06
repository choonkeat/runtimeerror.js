var runtimeerror = require('./lib/runtimeerror');
var Account = require('./lib/account').Account;

var MailParser = require("mailparser").MailParser,
    mailparser = new MailParser();
mailparser.on("end", function(mail_object) {
  var account = new Account(runtimeerror.extract_repo_secret_provider(mail_object.headers.to));
  runtimeerror.handle(account, mail_object.subject, mail_object.html || mail_object.text, function() { /* ok */ });
});

process.stdin.setEncoding('utf8');
process.stdin.pipe(mailparser);
