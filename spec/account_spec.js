var lodash = require('lodash');
var Account = require("../lib/account").Account;

describe("account", function() {
  describe("Account", function() {
    describe("new", function() {
      it("should accept options provider, repo, secret, label", function() {
        var options = { provider: "none", repo: "blah" + Math.random(), secret: "topsecret" + Math.random(), label: "bug" + Math.random() };
        var account = new Account(options);
        expect(account.provider).toBe(options.provider);
        expect(account.repo).toBe(options.repo);
        expect(account.secret).toBe(options.secret);
        expect(account.label).toBe(options.label);
      });
      it("should use process.env as default", function() {
        expect((process.env.PROVIDER && process.env.REPO && process.env.SECRET)).toBeTruthy();
        var account = new Account();
        expect(account.provider).toBe(process.env.PROVIDER);
        expect(account.repo).toBe(process.env.REPO);
        expect(account.secret).toBe(process.env.SECRET);
        expect(account.label).toBe(process.env.LABEL);
      });
    });
    describe("instance", function() {
      var account = new Account();
      describe("find_issue_by_title(title, callback)", function() {
        it("should call api.find_issue_by_title", function() {
          spyOn(account.api, "find_issue_by_title");
          account.find_issue_by_title("title", "callback", "ignore");
          expect(account.api.find_issue_by_title).toHaveBeenCalledWith("title", "callback");
        });
        it("should invoke callback", function() {
          var bool = false;
          var callback = function() { bool = true; }
          runs(function() { account.find_issue_by_title("title789", callback); });
          waitsFor(function() { return bool; });
        });
      });
      describe("create_issue(attrs, callback)", function() {
        it("should call api.create_issue", function() {
          spyOn(account.api, "create_issue");
          account.create_issue("attrs", "callback", "ignore1", "ignore2");
          expect(account.api.create_issue).toHaveBeenCalledWith("attrs", "callback");
        });
        it("should invoke callback", function() {
          var bool = false;
          var callback = function() { bool = true; }
          runs(function() { account.create_issue({}, callback); });
          waitsFor(function() { return bool; });
        });
      });
      describe("update_issue(uid, attrs, callback)", function() {
        it("should call api.update_issue", function() {
          spyOn(account.api, "update_issue");
          account.update_issue("uid", "attrs", "callback", "ignore");
          expect(account.api.update_issue).toHaveBeenCalledWith("uid", "attrs", "callback");
        });
        it("should invoke callback", function() {
          var bool = false;
          var callback = function() { bool = true; }
          runs(function() { account.update_issue(123, {}, callback); });
          waitsFor(function() { return bool; });
        });
      });
      describe("reopen_issue(uid, attrs, callback)", function() {
        it("should call api.reopen_issue", function() {
          spyOn(account.api, "reopen_issue");
          account.reopen_issue("uid", "attrs", "callback", "ignore");
          expect(account.api.reopen_issue).toHaveBeenCalledWith("uid", "attrs", "callback");
        });
        it("should invoke callback", function() {
          var bool = false;
          var callback = function() { bool = true; }
          runs(function() { account.reopen_issue(123, {}, callback); });
          waitsFor(function() { return bool; });
        });
      });
      describe("is_closed(attrs)", function() {
        it("should exist as function", function() {
          spyOn(account.api, 'is_closed');
          account.is_closed("1", "2", "3");
          expect(account.api.is_closed).toHaveBeenCalledWith("1", "2", "3");
        });
      });
      describe("is_wontfix(attrs)", function() {
        it("should exist as function", function() {
          spyOn(account.api, 'is_wontfix');
          account.is_wontfix("1", "2", "3");
          expect(account.api.is_wontfix).toHaveBeenCalledWith("1", "2", "3");
        });
      });
      describe("uid_for(attrs)", function() {
        it("should exist as function", function() {
          spyOn(account.api, 'uid_for');
          account.uid_for("1", "2", "3");
          expect(account.api.uid_for).toHaveBeenCalledWith("1", "2", "3");
        });
      })
    });
  });
});
