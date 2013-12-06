# RuntimeError.js

## What it does

1. Receive a `title` and `body` of a bug report (e.g. submitted via email or http; see `mechanisms` below)
2. Make `title` generic by replacing digits with `{N}` and hexadecimals with `{HEX}`
3. Find issue with generic title in Github Issues
4. Create a new issue if generic title is not found (team will be notified via Github)
5. Update occurrence `count` at the footer of issue description, if issue exists (no notifications)
6. `Reopen` issue if issue was `closed`, and add a comment (so we have fresh data to debug with; team will be notified via Github)
7. Ignore issue if issue is labelled as `wontfix` (no notifications)

## 1. Setup account

The way github works is that the creator/commenter of an issue will not be notified. This is correct logic, but does not suit our purpose.

We recommend using a separate `bot` github account instead of your own so that when errors happen, `bot` will create the issues and you'll get the github notifications. 

1. Create a separate `github` account, e.g. `bot`
2. Add `bot` to the repository you want to integrate with.
3. Go into [`Github.com > Account > Applications > Personal Access Tokens`](https://github.com/settings/tokens/new) and create a token for `bot` account, e.g. `token`
4. Optionally, turn off all [`email` and `web` notifications](https://github.com/settings/notifications) for `bot` account

## 2. Deploy to server

The easiest option is to deploy on Heroku

1. [Create a heroku app](https://dashboard.heroku.com/apps)
2. `git push` this repository to your heroku app
3. Set your environment variables (aka `heroku config:add`)

```
SECRET=<your token>
REPO=<your org>/<your repo> # e.g. rails/rails
PROVIDER=github # (optional, currently only supports github)
LABEL=bug # (optional)
```

This setup uses the `web.js` mechanism.

### Config via email address (instead of `ENV` variables)

`runtimeerror.js` can parse an email address to extract `REPO`, `SECRET`, `PROVIDER` as proposed in issue #1

For example:

```
"rails/rails" <aaabbccddeeff@github.com>
```

would configure `runtimeerror.js` to

```
REPO=rails/rails
SECRET=aaabbccddeeff
PROVIDER=github
```

This allows for multiple `repo/secret/provider` to share the same instance of `runtimeerror.js` deployed

## Mechanisms

### web.js

Upload an email as a bug report on Github Issues (email subject + email body). In production environment, we recommend setting environment variable `HIDE_UPLOAD_FORM=1` to hide this form.

The web application is also compatible with these popular error reporting tools

* [bugsnag](https://github.com/develsadvocates/runtimeerror.js/blob/master/bugsnag.md)
* [rollbar](https://github.com/develsadvocates/runtimeerror.js/blob/master/rollbar.md)
* [runtimeerror_notifier gem](http://rubygems.org/gems/runtimeerror_notifier)

NOTE: email address `to` is used as config, see `Config via email address` section above

```
node web.js
```

### procmail.js

Pipe email file through `stdin`. Compatible as [Postfix mailbox_command config](http://www.postfix.org/postconf.5.html#mailbox_command) or as `procmail` replacement.

```
node procmail.js < sample.eml
```

NOTE: email address `to` is used as config, see `Config via email address` section above

### cli.js

Command line arguments

```
node cli.js "title of bug" "bug description body"
```

## LICENSE

GPL v2

---
Brought to you by [RuntimeError.net](http://runtimeerror.net)
