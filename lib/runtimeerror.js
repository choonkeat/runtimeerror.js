var lodash = require('lodash');
var strftime = require('strftime');
var htmlparser = require("htmlparser2");
var select = require('soupselect').select;
var Account = require('./account').Account;
var last_account;

module.exports = {
  make_generic_title: function(title) {
    if (! title) return "";
    var regexps = [
      [/^(fwd|fw|re)\:\s/i, ''],
      [/0x[0-9a-f]+/i, '{HEX}'],
      [/\d+(\.\d+|)/i, '{N}'],
    ]
    lodash.forEach(regexps, function(pair) {
      while (title.match(pair[0])) { title = title.replace.apply(title, pair); }
    });
    return title;
  },
  update_body_suffix: function(body) {
    var today = strftime.strftime('%b %d', new Date());
    var meta = { runtimeerror: [today, 0] };
    try {
      var parts = body.split("<br/>\n");
      var str = parts.pop();
      if (str.match(/runtimeerror/)) {
        meta = JSON.parse(str);
        body = parts.join("<br/>\n");
      }
    } catch(err) {
      // okay to have no json suffix (e.g. legacy data)
    }
    // prep a list of whitelisted dates
    var dates = lodash.map([0, 1, 2, 3, 4, 5, 6], function(n) { return strftime.strftime('%b %d', new Date(new Date() - 3600000*24*n)); });
    // prune array and remove any out dated data (more than 7 days)
    lodash.each(meta.runtimeerror, function(item, index) {
      if ((index % 2) == 0) return;
      if (dates.indexOf(meta.runtimeerror[index-1]) == -1) meta.runtimeerror.splice(index-1, 2);
    });
    // if last data set is "today", +1; otherwise append [today,1]
    if (meta.runtimeerror[meta.runtimeerror.length-2] == today) {
      meta.runtimeerror[meta.runtimeerror.length-1]++;
    } else {
      meta.runtimeerror.push(today, 1);
    }
    return body + "<br/>\n" + JSON.stringify(meta);
  },
  extract_repo_secret_provider: function(email_address) {
    var match = email_address.match(/<?(\S+)@(\S+)\.\w+>?/)
    var repo = email_address.replace(match[0], '').replace(/^[\s\'\"]+/, '').replace(/[\s\'\"]+$/, '')
    return { repo: repo, secret: match[1], provider: match[2] };
  },
  find_or_create_account: function(options) {
    if (last_account && last_account.repo == options.repo && last_account.secret == options.secret && last_account.provider == options.provider) return last_account;
    last_account = new Account(options);
    return last_account;
  },
  handle: function(account, title, body, callback) {
    var runtimeerror = this;
    title = runtimeerror.make_generic_title(title);
    account.find_issue_by_title(title, function(err, found) {
      if (err) return callback(err);
      try {
        var handler = new htmlparser.DefaultHandler();
        var parser = new htmlparser.Parser(handler);
        parser.parseComplete(body);
        body = htmlparser.DomUtils.getInnerHTML({ children: select(handler.dom, 'body') }) || body;
        // github prefers <h1>, <h2> to be in their own lines, not stuck with a table, e.g. </table><h1>hello</h1><table>...
        if (body.match(/<h\d>/i)) body = body.replace(/>(<h\d>)/gi, ">\n$1").replace(/(<\/h\d>)</gi, "$1\n<");
      } catch(err) {
        // best effort HTML stripping: <body></body> only
      }
      body = runtimeerror.update_body_suffix(body);
      if (found) {
        if (account.is_wontfix(found)) return callback(); // do nothing
        found.body = runtimeerror.update_body_suffix(found.body);
        if (account.is_closed(found)) {
          account.reopen_issue(account.uid_for(found), { title: title, body: body }, callback);
        } else {
          account.update_issue(account.uid_for(found), found, callback);
        }
      } else {
        account.create_issue({ title: title, body: body }, callback);
      }
    });
  }
}
