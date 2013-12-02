var lodash = require('lodash');
var request = require('request');

var page_size = 30;
var label = process.env.ISSUE_LABEL || 'bug';
var octonode = require('octonode');

octonode.repo.prototype.create_issue_comment = function(number, comment, cb) {
  return this.client.post("/repos/" + this.name + "/issues/" + number + '/comments', comment, function(err, s, b) {
    if (err) {
      return cb(err);
    }
    if (s !== 201) {
      return cb(new Error("Repo create_issue_comment error"));
    } else {
      return cb(null, b);
    }
  });
}

octonode.repo.prototype.create_issue = function(issue, cb) {
  return this.client.post("/repos/" + this.name + "/issues", issue, function(err, s, b) {
    if (err) {
      return cb(err);
    }
    if (s !== 201) {
      return cb(new Error("Repo create_issue error"));
    } else {
      return cb(null, b);
    }
  });
}

octonode.repo.prototype.edit_issue = function(number, issue, cb) {
  return this.client.patch("/repos/" + this.name + "/issues/" + number, issue, function(err, s, b) {
    if (err) {
      return cb(err);
    }
    if (s !== 200) {
      return cb(new Error("Repo edit_issue error"));
    } else {
      return cb(null, b);
    }
  });
}

var github = octonode.client(process.env.PERSONAL_ACCESS_TOKEN);
var repo = github.repo(process.env.REPO);
repo.client.patch = function(path, content, callback) {
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

var find_issue_by_state_and_title = function(state, title, repo, page, callback) {
  console.log("find_issue_by_state_and_title", [state, title, repo.name, page, state]);
  page = page || 1;
  repo.issues({ page: 1, per_page: page_size, state: state }, function(err, issues) {
    if (err) return callback(err);
    var found = lodash.find(issues, function(issue) { return issue.title == title; });
    if (found) {
      callback(err, found);
    } else if (issues.length == page_size) {
      console.log(page, "next");
      process.nextTick(function() { find_issue_by_state_and_title(state, title, repo, page + 1, callback); });
    } else {
      console.log(404, "Not found");
      callback(err, null);
    }
  });
}

var find_issue_by_title = function(title, repo, callback) {
  console.log('find_issue_by_title', [title, repo.name]);
  find_issue_by_state_and_title('open', title, repo, 1, function(err, found) {
    if (err || found) return callback(err, found);
    find_issue_by_state_and_title('closed', title, repo, 1, callback);
  });
}

module.exports = {
  octonode: octonode,
  github: github,
  repo: repo,
  find_issue_by_title: find_issue_by_title,
}
