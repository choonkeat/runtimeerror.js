var nodebin = process.argv.shift();
var script = process.argv.shift();
var title = process.argv.shift();
var body = process.argv.shift();
if (title && body) {
  var runtimeerror = require('./lib/runtimeerror');
  var Account = require('./lib/account').Account;
  var account = new Account();
  runtimeerror.handle(account, title, body, function(err, result) {
    if (err) return console.error("FAIL", err);
    console.log("OKAY", result || '');
  });
} else {
  console.error(['Usage:', nodebin, script, '[title] [body]'].join(' '));
}
