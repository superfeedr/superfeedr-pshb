# Installing

Install and add to your `package.json` dependencies:

```bash
npm install --save superfeedr-pshb
```


# Usage

```javascript
// Vanilla JS:
var Superfeedr = require('superfeedr-pshb').default

// ES6:
import Superfeedr from 'superfeedr-pshb'
```


## Initialize and hook callback handler

First, create the client instance:

```javascript
var superfeedr = new Superfeedr(superfeedr_user, superfeedr_password, "http://me.example.com:8080/.pshb")
```

The last parameter is the URL remote hubs use to connect back to you.
For this to work, you *must* hook the PSHB request handler into your
HTTP server.

```javascript
http.createServer(function(req, res) {
  // Call PSHB handler:
  if (/^\/\.pshb/.test(req.url)) return pshbHandler(req, res)

  // Do anything else you want your web server to do:
  res.writeHead(404)
  res.write('No PSHB!')
  res.end()
}).listen(port)
```


## Event 'notification'

Deal with it:

```javascript
superfeedr.on('notification', function onNotification(notification, url) {
  // Consume here...
})
```


## superfeedr.subscribe(url, cb)

[Subscribe a feed](http://documentation.superfeedr.com/subscribers.html#adding-feeds-with-pubsubhubbub), calls back `cb(error, info)`


## superfeedr.unsubscribe(url, cb)

[Unsubscribe a feed](http://documentation.superfeedr.com/subscribers.html#removing-feeds-with-pubsubhubbub), calls back `cb(error, info)`


## superfeedr.list(opts, cb)

[List feeds](http://documentation.superfeedr.com/subscribers.html#listing-subscriptions-with-pubsubhubbub), calls back `cb(error, info)`


## superfeedr.streamSubscriptions(opts)

Joins the `superfeedr.list()` pages into a continuous stream of
subscription objects.


## superfeedr.retrieve(qs, cb)

[Retrieve the last entries](http://documentation.superfeedr.com/subscribers.html#retrieving-entries-with-pubsubhubbub),
calls back `cb(error, result)`


# Running the examples and tests

Configuration is accomplished using these environment variables:
* `SUPERFEEDR_USER` and `SUPERFEEDR_PASSWORD` (credentials)
* PSHB_HOST (public IP address, optionally with port) and PSHB_PORT (HTTP listen port)
