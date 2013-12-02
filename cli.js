var nodebin = process.argv.shift();
var script = process.argv.shift();
var title = process.argv.shift();
var body = process.argv.shift();
if (title && body) {
  var provider = require('./providers/' + (process.env.PROVIDER || 'github'));
  var runtimeerror = require('./runtimeerror');
  runtimeerror.handle(provider, title, body, function(err, result) {
    if (err) return console.error("FAIL", err);
    console.log("OKAY", result || '');
  });
} else {
  console.error(['Usage:', nodebin, script, '[title] [body]'].join(' '));
}
