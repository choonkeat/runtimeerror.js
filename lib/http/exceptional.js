var zlib = require('zlib');
var url = require('url');
var runtimeerror = require('../runtimeerror');
var Account = require('../account').Account;

module.exports = {
  handle: function(req, res, callback) {
    var uri = url.parse(req.url, !!'true:query as object');
    var to_account = runtimeerror.extract_repo_secret_provider(uri.query && uri.query.api_key);
    if (! to_account) return callback('Exceptional');
    var account = new Account(to_account);

    var chunks = [];
    var inflate = zlib.createInflate(); // Exceptional client Deflates without setting headers; brute force, no guessing
    inflate.on('error', callback);
    inflate.on('data', chunks.push.bind(chunks));
    inflate.on('end', function() {
      try {
        var body = chunks.join("").toString();
        var payload = JSON.parse(body);
        runtimeerror.handle(account, payload.exception.exception_class + ': ' + payload.exception.message, runtimeerror.json2markdown(payload), function(err, attrs) {
          callback(err, err ? null : "Exceptional");
        });
      } catch (e) {
        callback(e, 'Exceptional');
      }
    });
    req.pipe(inflate);
  }
}
