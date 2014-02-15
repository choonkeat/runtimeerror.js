# bugsnag

We can use the [bugsnag](https://github.com/develsadvocates/bugsnag-node) npm module in your app to talk to a `runtimeerror.js` server by configuring to connect to your `runtimeerror.js` server (with SSL turned off)

```
var bugsnag = require("bugsnag");
bugsnag.register("apiKey", {
  useSSL: false,
  notifyHost: 'localhost' || 'project-runtimeerrorjs.herokuapp.com',
  notifyPort: '3000'      || '80',
  notifyPath: '/',
});
```

NOTE: `apiKey` should be formatted as `"{repo}" <{secret}@{provider}.yourdomain.com>`; see `Config via email address` section in README.md
