var url = require('url');
var path = require('path');
var http = require('http');
var utils = require('util');
var querystring = require('querystring');
var node_static = require('node-static');
var lodash = require('lodash');
var strftime = require('strftime');
var request = require('request');

var nodebin = process.argv.shift();
var __script = process.argv.shift();
var title = process.argv.shift();
var body = process.argv.shift();
var page_size = 30;
var label = process.env.ISSUE_LABEL || 'bug';
var provider = require('./providers/' + (process.env.PROVIDER || 'github'));

var anonymized = function(title) {
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

var update_issue = function(repo, issue, title, body) {
  var wontfix = lodash.find(issue.labels, function(label) { return (label.name || "").toLowerCase() == 'wontfix' });
  var attrs = { body: suffixed(issue.body), state: (wontfix ? issue.state : 'open') };
  console.log('update_issue', { repo: repo.name, wontfix: wontfix, attrs: attrs });
  repo.edit_issue(issue.number, attrs, function(err, updated) {
    if (err) return console.error(err);
    if (issue.state == 'open') return;
    console.log("repo.create_issue_comment");
    repo.create_issue_comment(issue.number, { body: attrs.body }, function(err, updated) {
      console.log('create_issue_comment', { err: err });
    });
  });
}

var create_issue = function(repo, title, body) {
  var attrs = { title: title, body: suffixed(body), labels: label };
  console.log('create_issue', { repo: repo.name, attrs: attrs });
  repo.create_issue(attrs, function(err, created) { });
}

// main
issue_title = anonymized(title);
provider.find_issue_by_title(issue_title, provider.repo, function(err, found) {
  if (err) return console.error(err);
  if (found) {
    update_issue(provider.repo, found, issue_title, body);
  } else {
    create_issue(provider.repo, issue_title, body);
  }
});
