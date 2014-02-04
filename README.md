# RuntimeError.js

Why waste your time at *yet-another-middleman-website* to manage your errors. **Deploy your own, free runtimeerror.js & upgrade your Github Issues to manage error tracking directly.**

Clustered errors, full context & stacktrace in your email notifications, wontfix, direct email replies to `@johnappleseed` works as intended. What's not to like?

NOTE: integrations to `trello`, `pivotal tracker` or any other things should be added as a [provider](https://github.com/develsadvocates/runtimeerror.js/tree/master/lib/providers)

## How a human manage errors

1. Use a generic error message to group errors, e.g. `Session#create: User id={N} not found`
2. Create a new issue if the generic title is new (team will be notified via Github)
3. Update occurrence `count` if issue already exist (no notifications, keep issue fresh)
4. `Reopen` issue if it was `closed`, and add fresh debug data in comments (notify team of regression)
5. Ignore if issue was labelled `wontfix` (no notifications)

`runtimeerror.js` does exactly this.

## 1. Setup github account for api purpose

The way github works is that the creator/commenter of an issue will not be notified. This is a correct logic, but does not suit our purpose.

We recommend using a separate `bot` github account instead of your own so that when errors happen, `bot` will create the issues and you'll get the github notifications. 

1. Create a separate `github` account, e.g. `bot`
2. Add `bot` to the repository you want to integrate with.
3. Go into [`Github.com > Account > Applications > Personal Access Tokens`](https://github.com/settings/tokens/new) and create a token for `bot` account, e.g. `token`
4. Optionally, turn off all [`email` and `web` notifications](https://github.com/settings/notifications) for `bot` account

## 2. Deploy to a server

The easiest option is to deploy on Heroku

1. [Create a heroku app](https://dashboard.heroku.com/apps)
2. `git push` this repository to your heroku app
3. Optionally, set your environment variables (aka `heroku config:add`)

```
SECRET=<your token>
REPO=<your org>/<your repo> # e.g. rails/rails
PROVIDER=github # (optional, currently only supports github)
LABEL=bug # (optional)
```

This setup uses the `web.js` mechanism.

Setting environment variables is optional & not recommended. A better way is to use per-request config (see next point).

### RECOMMENDED: Per-Request config via email address

runtimeerror.js can parse the `to` email address format to extract `REPO`, `SECRET`, `PROVIDER` in the format of `"{repo}" <{secret}@{provider}.yourdomain.com>`

e.g. `"user/proj" <aaabbccddeeff@github.yourdomain.com>` would configure the error to be posted to `user/proj` repository on `github` using the access token `aaabbccddeeff`

This allows for multiple `repo/secret/provider` accounts to share the same deployment of `runtimeerror.js`.

## Mechanisms

### web.js

Upload an email as a bug report on Github Issues (email subject + email body). In production environment, we recommend setting environment variable `HIDE_UPLOAD_FORM=1` to hide this form.

```
node web.js
```

The web application is compatible with these popular error reporting tools

* [bugsnag](https://github.com/develsadvocates/runtimeerror.js/blob/master/bugsnag.md)
* [rollbar](https://github.com/develsadvocates/runtimeerror.js/blob/master/rollbar.md)
* [runtimeerror_notifier gem](http://rubygems.org/gems/runtimeerror_notifier) (set the `email to` as described in `config via email address` section above)

### procmail.js

Pipe email file through `stdin`. Compatible as [Postfix mailbox_command config](http://www.postfix.org/postconf.5.html#mailbox_command) or as `procmail` replacement.

```
node procmail.js < sample.eml
```

NOTE: `email to` is used as account config, see `config via email address` section above

### cli.js

Command line arguments

```
node cli.js "title of bug" "bug description body"
```

## Changelog

* `0.2.0` Issue description now shows sparkline image, reflecting error trend of past 7 days

## LICENSE

GPL v2

---
Brought to you by [RuntimeError.net](http://runtimeerror.net)
