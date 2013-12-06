var lodash = require('lodash');
var request = require('request');
var octonode = require('octonode');
var page_size = 30;

var patch_method = function(path, content, callback) {
  var _this = this;
  return request({
    uri: this.buildUrl(path),
    method: 'PATCH',
    body: JSON.stringify(content),
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'octonode/0.3 (https://github.com/pksunkara/octonode) terminal/0.0'
    }
  }, function(err, res, body) {
    if (err) {
      return callback(err);
    }
    return _this.errorHandle(res, body, callback);
  });
};

function Provider(repo, secret, label) {
  this.github = octonode.client(secret);
  this.repo = this.github.repo(repo);
  this.repo.client.patch = patch_method;
  this.label = label;
};

Provider.prototype.find_issue_by_state_and_title = function(state, title, page, callback) {
  var that = this;
  page = page || 1;
  console.log("find_issue_by_state_and_title", [state, title, page, that.repo.name]);
  that.repo.issues({ page: page, per_page: page_size, state: state }, function(err, issues) {
    if (err) return callback(err);
    var found = lodash.find(issues, function(issue) { return issue.title == title; });
    if (found) {
      console.log(200, "Found");
      callback(err, found);
    } else if (issues.length == page_size) {
      console.log(302, "Next page", page);
      process.nextTick(function() { that.find_issue_by_state_and_title(state, title, page + 1, callback); });
    } else {
      console.log(404, "Not found");
      callback(err, null);
    }
  });
}


Provider.prototype.find_issue_by_title = function(title, callback) {
  var that = this;
  console.log('find_issue_by_title', [title, that.repo.name]);
  that.find_issue_by_state_and_title('open', title, 1, function(err, found) {
    if (err || found) return callback(err, found);
    that.find_issue_by_state_and_title('closed', title, 1, callback);
  });
};

Provider.prototype.create_issue = function(attrs, callback) {
  this.repo.create_issue({ title: attrs.title, body: attrs.body, labels: this.label }, callback);
};

Provider.prototype.update_issue = function(uid, attrs, callback) {
  this.repo.edit_issue(uid, { title: attrs.title, body: attrs.body, labels: this.label }, callback);
};

Provider.prototype.reopen_issue = function(uid, attrs, callback) {
  var that = this;
  that.repo.edit_issue(uid, { state: 'open' }, function() {
    that.repo.create_issue_comment(uid, { body: attrs.body }, callback);
  });
};

Provider.prototype.is_closed = function(attrs) {
  return attrs.state == 'closed';
};

Provider.prototype.is_wontfix = function(attrs) {
  return lodash.find(attrs.labels, function(label) { return (label.name || "").toLowerCase() == 'wontfix' });
};

Provider.prototype.uid_for = function(attrs) {
  return attrs.number;
}

module.exports = {
  Provider: Provider
};
