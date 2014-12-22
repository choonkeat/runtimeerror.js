var lodash = require('lodash');
var github = require('../../lib/providers/github');

describe("github", function() {
  var provider = new github.Provider("repo", "secret", "label");
  describe("create_issue(attrs, callback)", function() {
    it("should include keys: title, body, labels", function() {
      var bool = false;
      spyOn(provider.repo, "create_issue").andCallFake(function(attrs, callback) {
        expect(lodash.keys(attrs).toString()).toBe(['title', 'body', 'labels'].toString());
        expect(typeof attrs['labels']).toBe('object');
        callback();
      });
      var callback = function() { bool = true; }
      runs(function() {
        provider.create_issue({}, callback);
      });
      waitsFor(function() { return bool; });
    });
  });
  describe("update_issue(uid, attrs, callback)", function() {
    it("should include keys: title, body, labels", function() {
      var bool = false;
      spyOn(provider.repo, "edit_issue").andCallFake(function(uid, attrs, callback) {
        expect(lodash.keys(attrs).toString()).toBe(['title', 'body', 'labels'].toString());
        bool = true;
        callback();
      });
      var callback = function() {  }
      runs(function() {
        provider.update_issue("uid", {}, callback);
      });
      waitsFor(function() { return bool; });
    });
  });
  describe("reopen_issue(uid, attrs, callback)", function() {
    it("should call repo.edit_issue(state: open) + repo.create_issue_comment", function() {
      var edited = false;
      var commented = false;
      spyOn(provider.repo, "edit_issue").andCallFake(function(uid, attrs, callback) {
        expect(lodash.keys(attrs).toString()).toBe(['state'].toString());
        expect(attrs.state).toBe('open');
        edited = true;
        callback();
      });
      spyOn(provider.repo, "create_issue_comment").andCallFake(function(uid, attrs, callback) {
        expect(lodash.keys(attrs).toString()).toBe(['body'].toString());
        commented = true;
        callback();
      });
      var callback = function() {  }
      runs(function() {
        provider.reopen_issue("uid", {}, callback);
      });
      waitsFor(function() { return edited; });
      waitsFor(function() { return commented; });
    });
  });
  describe("uid_for", function() {
    it("should return attrs.number", function() {
      expect(provider.uid_for({ })).not.toBeTruthy();
      expect(provider.uid_for({ number: "123" })).toBe("123");
    });
  });
  describe("is_closed", function() {
    it("should return if attrs.labels contain label.name == 'closed'", function() {
      expect(provider.is_closed({ })).not.toBeTruthy();
      expect(provider.is_closed({ state: null })).not.toBeTruthy();
      expect(provider.is_closed({ state: 'open' })).not.toBeTruthy();
      expect(provider.is_closed({ state: 'closed' })).toBeTruthy();
    });
  });
  describe("is_wontfix", function() {
    it("should return if attrs.labels contain label.name == 'wontfix'", function() {
      expect(provider.is_wontfix({ })).not.toBeTruthy();
      expect(provider.is_wontfix({ labels: [] })).not.toBeTruthy();
      expect(provider.is_wontfix({ labels: [{ }] })).not.toBeTruthy();
      expect(provider.is_wontfix({ labels: [{ name: "hey" }] })).not.toBeTruthy();
      expect(provider.is_wontfix({ labels: [{ name: "hey" }, { name: "wontfix" }] })).toBeTruthy();
      expect(provider.is_wontfix({ labels: [{ name: "hey" }, { name: "WontFix" }] })).toBeTruthy();
    });
  });
  describe('my_email', function() {
    it('should return "email" attribute of authenticated user', function() {
      var email = 'verified@email.com';
      var bool = false;
      spyOn(provider.me, "info").andCallFake(function(fn) {
        fn(null, { login: 'blah', email: email });
      });
      var callback = function(err, string) {
        expect(err).not.toBeTruthy();
        expect(string).toBe(email);
        bool = true;
      }
      runs(function() {
        provider.my_email(callback);
      });
      waitsFor(function() { return bool; });
    });
  });
});
