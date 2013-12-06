var strftime = require('strftime');
var lodash = require('lodash');
var htmlparser = require("htmlparser2");
var select = require('soupselect').select;

function Account(options) {
  options = options || {};
  this.provider = options.provider || process.env.PROVIDER || 'github';
  this.repo = options.repo || process.env.REPO;
  this.secret = options.secret || process.env.SECRET || process.env.PERSONAL_ACCESS_TOKEN;
  this.label = options.label || process.env.LABEL || process.env.ISSUE_LABEL;
  var provider = require('./providers/' + this.provider);
  this.api = new provider.Provider(this.repo, this.secret, this.label);
}

Account.prototype.find_issue_by_title = function(title, callback) {
  return this.api.find_issue_by_title(title, callback);
}
Account.prototype.create_issue = function(attrs, callback) {
  return this.api.create_issue(attrs, callback);
};
Account.prototype.update_issue = function(uid, attrs, callback) {
  return this.api.update_issue(uid, attrs, callback);
};
Account.prototype.reopen_issue = function(uid, attrs, callback) {
  return this.api.reopen_issue(uid, attrs, callback);
}
Account.prototype.is_closed = function() {
  return this.api.is_closed.apply(this.api, arguments);
};
Account.prototype.is_wontfix = function() {
  return this.api.is_wontfix.apply(this.api, arguments);
};
Account.prototype.uid_for = function() {
  return this.api.uid_for.apply(this.api, arguments);
};

module.exports = {
  Account: Account
}
