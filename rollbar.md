# rollbar

We can use the `rollbar` npm module in your app to talk to a `runtimeerror.js` server by configuring to connect to your `runtimeerror.js` server

```
var rollbar = require("rollbar");
rollbar.init("apiKey", {
  endpoint: 'http://localhost:3000/' || 'http://project-runtimeerrorjs.herokuapp.com/',
});
```

NOTE: `apiKey` can be any string.