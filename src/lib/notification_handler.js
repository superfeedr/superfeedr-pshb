'use strict'

import querystring from 'querystring'
import crypto from 'crypto'

class NotificationHandler extends process.EventEmitter {
  constructor (url) {
    super()
    this.url = url
  }

  /**
   * Get local 'hub.callback' URL
   * 
   * @param {String} Feed URL
   * @return {String} URL of local endpoint
   **/
  getUrlFor (_url) {
    return this.url
  }

  /**
   * Generate 'hub.secret'
   * 
   * @param {String} Feed URL
   **/
  getSecretFor (_url) {
    return 'foo'
  }

  /**
   * To be plugged into a HTTP server handler
   **/
  handleRequest (req, res) {
    let urlParts = req.url.split('?', 2)
    let query = querystring.parse(urlParts[1] || '')

    if (req.method === 'GET' &&
        (query['hub.mode'] === 'subscribe' ||
         query['hub.mode'] === 'unsubscribe')
    ) {
      // TODO: provide user hook to reject
      res.write(query['hub.challenge'])
      res.end()
    } else if (req.method === 'POST') {
      let m
      if ((m = (req.headers['x-hub-signature'] || '').match(/^sha1=(.+)/))) {
        this._handleNotification(req, res, query, m[1])
      } else {
        res.writeHead(400)
        res.write('X-Hub-Signature expected')
        res.end()
      }
    } else {
      res.writeHead(400)
      res.end()
    }
  }

  _handleNotification (req, res, query, signature) {
    let url = query['hub.topic']
    let hmac = crypto.createHmac('sha1', this.getSecretFor(url))
    let bufs = []
    req.on('data', data => {
      bufs.push(data)
      hmac.update(data)
    })
    req.on('end', () => {
      let result
      try {
        let expectedSignature = hmac.digest('hex')
        if (signature.toLowerCase() !== expectedSignature.toLowerCase()) {
          console.error('Signature verification failed', { signature, expectedSignature })
          res.writeHead(204)
          res.end()
          return
        }
        result = JSON.parse(bufs.join(''))
      } catch (e) {
        console.error(e.stack || e.message)

        res.writeHead(500)
        res.end()
        return
      }

      res.writeHead(200)
      res.end()

      console.log('notification', url, result)
      console.log('this emits:', this)
      this.emit('notification', result, url)
    })
  }
}

export default NotificationHandler
