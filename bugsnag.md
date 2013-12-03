# bugsnag

We can use the `bugsnag` npm module in your app to talk to a `runtimeerror.js` server by configuring to connect to your `runtimeerror.js` server (with SSL turned off)

```
var bugsnag = require("bugsnag");
bugsnag.register("apiKey", {
  useSSL: false,
  notifyHost: 'localhost' || 'project-runtimeerrorjs.herokuapp.com',
  notifyPort: '3000'      || '80',
  notifyPath: '/',
});
```

NOTE: `apiKey` can be any string.