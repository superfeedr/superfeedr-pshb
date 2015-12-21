'use strict'

import request from 'request'
import package_json from '../package.json'

import NotificationHandler from './notification_handler'
import SubscriptionsStream from './subscriptions_stream'

const PUSH_ENDPOINT = 'https://push.superfeedr.com'

const USER_AGENT = `superfeedr-pshb/${package_json.version} (${process.release.name}/${process.version}; ${process.platform}; ${process.arch})`

class Superfeedr extends process.EventEmitter {
  constructor (username, password, handler) {
    super()

    this.auth = {
      username: username,
      password: password
    }

    if (typeof handler === 'string') {
      this.handler = new NotificationHandler(handler)
    } else if (handler) {
      this.handler = handler
    } else {
      throw new Error('No handler')
    }
    this.handler.on('notification', (...args) => { this.emit('notification', ...args) })
  }

  get handleRequest () {
    return (...args) => this.handler.handleRequest(...args)
  }

  _request (params, cb) {
    params.auth = this.auth
    if (!params.headers) {
      params.headers = {}
    }
    params.headers['Accept'] = 'application/json'
    params.headers['User-Agent'] = USER_AGENT

    request(params, (err, res, body) => {
      if (err) return cb(err)

      if (res.statusCode < 200 || res.statusCode >= 300) {
        console.error(body)
        return cb(new Error(`HTTP ${res.statusCode}`))
      }

      if (/^application\/json/.test(res.headers['content-type'])) {
        var json
        try {
          json = JSON.parse(body)
        } catch (e) {
          return cb(e)
        }
        cb(null, json)
      } else {
        cb(null, body)
      }
    })
  }

  _postToPushEndpoint (form, cb) {
    this._request({
      method: 'POST',
      url: PUSH_ENDPOINT,
      form: form
    }, cb)
  }

  subscribe (url, cb) {
    this._postToPushEndpoint({
      'hub.mode': 'subscribe',
      'hub.topic': url,
      'hub.callback': this.handler.getUrlFor(url),
      'hub.secret': this.handler.getSecretFor(url),
      'hub.verify': 'sync',
      'format': 'json'
    }, cb)
  }

  unsubscribe (url, cb) {
    this._postToPushEndpoint({
      'hub.mode': 'unsubscribe',
      'hub.topic': url,
      'hub.callback': this.handler.getUrlFor(url),
      'hub.verify': 'sync'
    }, cb)
  }

  list (opts, cb) {
    var qs = {
      'hub.mode': 'list'
    }
    if (typeof opts === 'string' || typeof opts === 'number') {
      // Support for calling with page number, known from the XMPP module:
      qs.page = opts
    } else {
      // Support for flexible options { page, by_page, search, detailed }:
      for (var k in opts) {
        qs[k] = opts[k]
      }
    }

    this._request({
      method: 'GET',
      url: PUSH_ENDPOINT,
      qs: qs
    }, cb)
  }

  streamSubscriptions (opts) {
    return new SubscriptionsStream(this, opts)
  }

  retrieve (qs, cb) {
    if (typeof qs === 'string') {
      qs = { 'hub.topic': qs }
    }
    qs['hub.mode'] = 'retrieve'
    qs.format = 'json'

    this._request({
      method: 'GET',
      url: PUSH_ENDPOINT,
      qs: qs
    }, cb)
  }
}

export default Superfeedr
