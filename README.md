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

## Execute

```
node script.js "title of bug" "bug description body"
```

## TODO
1. passing `title` and `body` other than via command line
