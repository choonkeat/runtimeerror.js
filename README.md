# RuntimeError.js

## Setup

1. create a separate `github` account, e.g. `bot`
2. add `bot` to the repository you want to integrate with.
3. go into `bot > account > applications > personal access token` and create a token, e.g. `token`
4. optionally, turn off all `email` and `web` notifications for `bot` account
5. set environment variable `PERSONAL_ACCESS_TOKEN` = `token`
6. set environment variable `REPO`, e.g. `rails/rails`
7. optionally, set environment variable `PROVIDER`, default to `github` (currently only supports `github`)
8. optionally, set environment variable `ISSUE_LABEL`, default to `bug` (default label in Github.com)

NOTE: we recommend using a `bot` account instead of your own account so that when errors happen and `bot` creates issues, you'll get the github notifications.

## Usage

### cli.js

Submit an incident via command line and arguments

```
node cli.js "title of bug" "bug description body"
```

### procmail.js

Submit an incident via command line piping email file via stdin. Compatible as [Postfix mailbox_command config](http://www.postfix.org/postconf.5.html#mailbox_command)

```
node procmail.js < sample.eml
```

### web.js

HTTP interface to receive email file upload. Compatible with [runtimeerror_notifier gem](http://rubygems.org/gems/runtimeerror_notifier)

```
node web.js
```

---
Brought to you by [RuntimeError.net](http://runtimeerror.net)