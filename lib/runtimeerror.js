var lodash = require('lodash');
var strftime = require('strftime');
var mimelib = require('mimelib');
var htmlescape = require('escape-html');
var htmlparser = require("htmlparser2");
var select = require('soupselect').select;
var Account = require('./account').Account;
var nodemailer = require("nodemailer");
var os = require('os');
var last_account;

module.exports = {
  duplicates: {},
  duplicates_key: function(account, generic_title) {
    return JSON.stringify([account.repo, account.secret, account.provider, generic_title]);;
  },
  skip_duplicate: function(account, generic_title) {
    var key = this.duplicates_key(account, generic_title);
    return (this.duplicates[key] = (this.duplicates[key] || 0) + 1) > 1;
  },
  make_generic_title: function(title) {
    if (! title) return "";
    var regexps = [
      [/^(fwd|fw|re)\:\s/gi, ''],
      [/0x[0-9a-f]+/gi, '{HEX}'],
      [/\b\d+(\.\d+|)\b/gi, '{N}'],
      [/\b[0-9][0-9a-f]+|[0-9a-f]+[0-9]\b/gi, '{HEX}'],
    ]
    lodash.forEach(regexps, function(pair) {
      while (title.match(pair[0])) { title = title.replace.apply(title, pair); }
    });
    return title;
  },
  json2htmltables: function(json) {
    if (typeof json == 'string') return htmlescape(json);
    var runtimeerror = this;
    var chunks = ['<table>'];
    var v;
    for (var k in json) {
      v = json[k];
      if ((typeof v) == 'object') {
        chunks.push('</table>');
        chunks.push('<h4>' + runtimeerror.json2htmltables(k) + '</h4>');
        if (v.length == undefined) {
          chunks.push(runtimeerror.json2htmltables(v));
        } else {
          var joined = lodash.map(v, runtimeerror.json2htmltables.bind(runtimeerror)).join("\n");
          var juststrings = (joined.indexOf('<') == -1);
          chunks.push((juststrings ? '\n<pre>\n' : '') + joined + (juststrings ? '\n</pre>\n' : ''));
        }
        chunks.push('<table>');
      } else {
        chunks.push('<tr><th align="left">' + runtimeerror.json2htmltables(k) + '</th><td align="left">' + runtimeerror.json2htmltables(v) + '</td></tr>');
      }
    }
    chunks.push('</table>');
    return chunks.join('');
  },
  sparkline_url: function(date_count_array) {
    var dates = lodash.map([6, 5, 4, 3, 2, 1, 0], function(n) { return strftime.strftime('%b %d', new Date(new Date() - 3600000*24*n)); });
    var values = [];
    lodash.each(dates, function(date, index) {
      var i = date_count_array.indexOf(date);
      if (i == -1) return values.push(0);
      values.push(date_count_array[i+1]);
    });
    var url_prefix = process.env.SPARKLINE_URL || "http://sparklines-bitworking.appspot.com/spark.cgi?type=impulse&height=40&upper={MAX}&above-color=red&below-color=gray&width=5&limits={MIN},{MAX}&d={RAW}";
    return url_prefix.replace(/\{([^{}]*)\}/g, function (a, b) {
      if (b == 'MIN') return "0";
      if (b == 'MAX') return lodash.max(values);
      if (b == 'RAW') return values.join(',');
    });
  },
  update_body_suffix: function(body, more) {
    var that = this;
    more = more || 1;
    var today = strftime.strftime('%b %d', new Date());
    var meta = { runtimeerror: [today, 0] };
    try {
      var parts = body.split(/<br\/>[\r\n]+/);
      var str = parts.pop();
      if (str.match(/runtimeerror/)) {
        var handler = new htmlparser.DefaultHandler();
        var parser = new htmlparser.Parser(handler);
        parser.parseComplete(str);
        var dom = handler.dom[0];
        if (dom.data) { // raw JSON (= 0.1.0)
          meta = JSON.parse(dom.data);
          body = parts.join("<br/>\n");
        } else if (dom.attribs && dom.attribs.title) { // image tag (>= 0.2.0)
          meta = JSON.parse(dom.attribs.title);
          body = parts.join("<br/>\n");
        }
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
      var key = (meta.runtimeerror.length-1);
      meta.runtimeerror[key] = meta.runtimeerror[key] + more;
    } else {
      meta.runtimeerror.push(today, more);
    }
    var img_url = that.sparkline_url(meta.runtimeerror);
    var json = JSON.stringify(meta);
    var img = "<img src='" + img_url + "' alt='" + json + "' title='" + json + "'/>";
    return body + "<br/>\n" + img;
  },
  extract_repo_number_provider_secret: function(message_id) {
    try {
      // <{repo}/issues/{number}@{provider=github}.{secret}.random>
      var parts = message_id.replace(/^\<|\>$/g, '').split('@');
      var repo_parts = parts[0].split('/issues/');
      var number = repo_parts[1];
      var index = parts[1].indexOf('.');
      var provider = parts[1].substring(0, index);
      var secret = parts[1].substring(index+1);
      secret = secret.substring(0, secret.lastIndexOf('.'));
      if (number && secret && (provider == 'github' || 'none')) {
        return {
          repo: repo_parts[0],
          number: number,
          provider: provider,
          secret: secret
        }
      }
    } catch (e) {}
  },
  extract_repo_secret_provider: function(email_address) {
    var result;
    lodash.forEach(mimelib.parseAddresses(email_address), function(addr) {
      var match = addr.address.match(/(\S+?)(\+(.+)|)@([^\.]+)\.\w+/);
      if (match) {
        result = {}
        result.repo = addr.name;
        result.secret = (process.env[match[1].toString() + "_SECRET"] || match[1]);
        if (match[3]) result.label = match[3].replace(/\+/g, ' ');
        result.provider = match[4];
      }
    });
    return result;
  },
  find_or_create_account: function(options) {
    if (last_account && last_account.repo == options.repo && last_account.secret == options.secret && last_account.provider == options.provider) return last_account;
    last_account = new Account(options);
    return last_account;
  },
  email_transport: function() {
    if (process.env.MAILER_TYPE && process.env.MAILER_OPTIONS_JSON && process.env.MAILER_REPLY_TO && process.env.MAILER_FROM) {
      return nodemailer.createTransport(process.env.MAILER_TYPE, JSON.parse(process.env.MAILER_OPTIONS_JSON));
    }
  },
  notify: function(account, attrs, callback) {
    var transport = this.email_transport();
    if (! transport) return callback();
    account.api.my_email(function(err, email) {
      if (!email) return callback();
      transport.sendMail(account.api.mail_options(email, attrs), callback);
    });
  },
  handle: function(account, title, body, callback) {
    var runtimeerror = this;
    title = runtimeerror.make_generic_title(title);

    // if already processing this same bug report, we register a duplicate count & exit like the job is already done
    if (this.skip_duplicate(account, title)) return callback();

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

      // by the time 'account.find_issue_by_title', how many have we collected?
      var key = runtimeerror.duplicates_key(account, title);
      var more = runtimeerror.duplicates[key];
      delete runtimeerror.duplicates[key];

      body = runtimeerror.update_body_suffix(body, more);
      if (found) {
        found.body = runtimeerror.update_body_suffix(found.body, more);
        if (account.is_closed(found) && (! account.is_wontfix(found))) {
          account.reopen_issue(account.uid_for(found), { title: title, body: body }, function(err, attrs) {
            for (var x in attrs) found[x] = attrs[x]; // util.extend(found, attrs);
            runtimeerror.notify(account, found, function() { callback(err, attrs); });
          });
        } else {
          account.update_issue(account.uid_for(found), found, callback);
        }
      } else {
        account.create_issue({ title: title, body: body }, function(err, attrs) {
          if (attrs) {
            runtimeerror.notify(account, attrs, function() { callback(err, attrs); });
          } else {
            callback(err || "create_issue return no attrs");
          }
        });
      }
    });
  }
}
