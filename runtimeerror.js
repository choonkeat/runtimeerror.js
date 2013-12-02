var strftime = require('strftime');
var lodash = require('lodash');
var htmlparser = require("htmlparser2");
var select = require('soupselect').select;
var label = process.env.ISSUE_LABEL || 'bug';

// replace digits with {N} and 0xFFF hexadecimals with {HEX}
var make_generic = function(title) {
  var regexps = [
    [/\A(fwd|fw|re)\:\s/i, ''],
    [/0x[0-9a-f]+/i, '{HEX}'],
    [/\d+(\.\d+|)/i, '{N}'],
  ]
  lodash.forEach(regexps, function(pair) {
    while (title.match(pair[0])) { title = title.replace.apply(title, pair); }
  });
  return title;
}

var suffixed = function(body) {
  var meta = { runtimeerror: [strftime.strftime('%b %d', new Date()), 0] };
  try {
    var parts = body.split("<br/>\n");
    var str = parts.pop();
    if (str.match(/runtimeerror/)) {
      meta = JSON.parse(str);
      body = parts.join("<br/>\n");
    }
  } catch(err) {
    console.error(err);
  }
  meta.runtimeerror[1]++;
  return body + "<br/>\n" + JSON.stringify(meta);
}

var update_issue = function(repo, issue, title, body, callback) {
  var wontfix = lodash.find(issue.labels, function(label) { return (label.name || "").toLowerCase() == 'wontfix' });
  var attrs = { body: suffixed(issue.body), state: (wontfix ? issue.state : 'open') };
  // console.log('update_issue', { repo: repo.name, wontfix: wontfix, attrs: attrs });
  repo.edit_issue(issue.number, attrs, function(err, updated) {
    if (err) return callback(err);
    if (issue.state == 'open') return callback();
    attrs = { body: suffixed(body) };
    // console.log("repo.create_issue_comment", attrs);
    repo.create_issue_comment(issue.number, attrs, callback);
  });
}

var create_issue = function(repo, title, body, callback) {
  var attrs = { title: title, body: suffixed(body), labels: label };
  // console.log('create_issue', { repo: repo.name, attrs: attrs });
  repo.create_issue(attrs, callback);
}

module.exports = {
  handle: function(provider, title, body, callback) {
    try {
      // best effort HTML stripping: body only
      var handler = new htmlparser.DefaultHandler();
      var parser = new htmlparser.Parser(handler);
      parser.parseComplete(body);
      body = htmlparser.DomUtils.getInnerHTML({ children: select(handler.dom, 'body') }) || body;
      // github prefers <h1>, <h2> to be in their own lines, not stuck with a table, e.g. </table><h1>hello</h1><table>...
      if (body.match(/<h\d>/i)) body = body.replace(/>(<h\d>)/gi, ">\n$1").replace(/(<\/h\d>)</gi, "$1\n<");
    } catch(err) {
      // console.error(err);
    }
    if (! (provider && title && body)) return callback("Blank values not accepted");
    issue_title = make_generic(title);
    provider.find_issue_by_title(issue_title, provider.repo, function(err, found) {
      if (err) return callback(err);
      if (found) {
        update_issue(provider.repo, found, issue_title, body, callback);
      } else {
        create_issue(provider.repo, issue_title, body, callback);
      }
    });
  }
}
