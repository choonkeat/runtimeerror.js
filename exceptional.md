# Exceptional

We can use the [exceptional](https://github.com/develsadvocates/exceptional) gem in your app to talk to a `runtimeerror.js` server by configuring to connect to your `runtimeerror.js` server


Edit your `config/exceptional.yml`:

```
api-key: apiKey
remote-host: project-runtimeerrorjs.herokuapp.com
http-open-timeout: 30
http-read-timeout: 30
```

You can test it by executing the command line:

```
exceptional test
```

NOTE: `apiKey` should be formatted as `"{repo}" <{secret}@{provider}.yourdomain.com>`; see `Config via email address` section in README.md

### Important

The value of `apiKey` in `config/exceptional.yml` must be URI escaped. For example `hello/world <secret@provider.yourdomain.com>` must be written as `hello/world%20%3Csecret@provider.yourdomain.com%3E`