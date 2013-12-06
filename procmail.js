var runtimeerror = require('./lib/runtimeerror');
var Account = require('./lib/account').Account;
var account = new Account();

var MailParser = require("mailparser").MailParser,
    mailparser = new MailParser();
mailparser.on("end", function(mail_object) {
  runtimeerror.handle(account, mail_object.subject, mail_object.html || mail_object.text, function() { /* ok */ });
});

process.stdin.setEncoding('utf8');
process.stdin.pipe(mailparser);
