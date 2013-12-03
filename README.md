# RuntimeError.js

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
PERSONAL_ACCESS_TOKEN=<your token>
REPO=<your org>/<your repo> # e.g. rails/rails
PROVIDER=github # (optional, currently only supports github)
ISSUE_LABEL=bug # (optional)
```

This setup uses the `web.js` mechanism.

## Mechanisms

### web.js

`HTTP POST` an email file upload. Compatible with [runtimeerror_notifier gem](http://rubygems.org/gems/runtimeerror_notifier)

```
node web.js
```

### procmail.js

Pipe email file through `stdin`. Compatible as [Postfix mailbox_command config](http://www.postfix.org/postconf.5.html#mailbox_command)

```
node procmail.js < sample.eml
```

### cli.js

Command line arguments

```
node cli.js "title of bug" "bug description body"
```

## LICENSE

GPL v2

---
Brought to you by [RuntimeError.net](http://runtimeerror.net)