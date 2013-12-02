var provider = require('./providers/' + (process.env.PROVIDER || 'github'));
var runtimeerror = require('./runtimeerror');

var MailParser = require("mailparser").MailParser,
    mailparser = new MailParser();
mailparser.on("end", function(mail_object) {
  runtimeerror.handle(provider, mail_object.subject, mail_object.html || mail_object.text, function() { /* ok */ });
});

process.stdin.setEncoding('utf8');
process.stdin.pipe(mailparser);
