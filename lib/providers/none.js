function Provider(repo, secret, label) {

};

Provider.prototype.find_issue_by_title = function(title, callback) {
  callback();
};

Provider.prototype.create_issue = function(attrs, callback) {
  callback();
};

Provider.prototype.update_issue = function(uid, attrs, callback) {
  callback();
};

Provider.prototype.reopen_issue = function(uid, attrs, callback) {
  callback();
};

Provider.prototype.is_closed = function(attrs) {
  return false;
};

Provider.prototype.is_wontfix = function(attrs) {
  return false;
};

Provider.prototype.uid_for = function(attrs) {
  return attrs.uid;
}

module.exports = {
  Provider: Provider
};
