# rollbar

We can use the `rollbar` npm module in your app to talk to a `runtimeerror.js` server by configuring to connect to your `runtimeerror.js` server

``` javascript
var rollbar = require("rollbar");
rollbar.init("apiKey", {
  endpoint: 'http://localhost:3000/' || 'http://project-runtimeerrorjs.herokuapp.com/',
});
```

``` python
import rollbar
rollbar.init('apiKey',
  environment='production',
  endpoint='http://127.0.0.1:3000/')

try:
    main_app_loop()
except IOError:
    rollbar.report_message('Got an IOError in the main loop', 'warning')
except:
    # catch-all
    rollbar.report_exc_info()
```

NOTE: `apiKey` should be formatted as `repo <token@provider.com>`; see `Config via email address` section in README.md
