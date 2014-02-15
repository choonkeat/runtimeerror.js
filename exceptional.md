# Exceptional

We can use the [exceptional](https://github.com/develsadvocates/exceptional) gem in your app to talk to a `runtimeerror.js` server by configuring to connect to your `runtimeerror.js` server


Edit your `config/exceptional.yml`:

```
api-key: <%= URI.escape(apiKey).inspect %>
remote-host: <%= URI.parse('http://localhost:3000/' || 'http://project-runtimeerrorjs.herokuapp.com/').host %>
remote-port: <%= URI.parse('http://localhost:3000/' || 'http://project-runtimeerrorjs.herokuapp.com/').port %>
http-open-timeout: 30
http-read-timeout: 30
```

You can test it by executing the command line:

```
exceptional test
```

NOTE: `apiKey` should be formatted as `"{repo}" <{secret}@{provider}.yourdomain.com>`; see `Config via email address` section in README.md
