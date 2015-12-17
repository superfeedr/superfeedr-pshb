'use strict'

import tap from 'tap'
import assert from 'assert'
import http from 'http'
import request from 'request'
import Superfeedr from '../lib/'

const ENV_VARS = ['SUPERFEEDR_USER', 'SUPERFEEDR_PASSWORD', 'HTTP_HOST', 'HTTP_PORT']
let missingVars = ENV_VARS.filter(v => !process.env[v])
if (missingVars.length > 0) {
  console.error(`Please set the following environment variables: ${missingVars.join(' ')}`)
  process.exit(1)
}

var superfeedr = new Superfeedr(
  process.env.SUPERFEEDR_USER,
  process.env.SUPERFEEDR_PASSWORD,
  `http://${process.env.HTTP_HOST}/.pshb`
)
var server = http.createServer(superfeedr.handleRequest)
      .listen(parseInt(process.env.HTTP_PORT, 10))
server.on('error', e => assert.ifError(e))

const PUBLISHER_URL = 'http://push-pub.appspot.com'

tap.test('subscribe to the Publisher feed', t => {
  superfeedr.subscribe(`${PUBLISHER_URL}/feed`, (err) => {
    assert.ifError(err)
    t.passing()
    // Let backends settle
    setTimeout(() => t.end(), 1000)
  })
})

tap.test('trigger the Publisher', {
  timeout: 300 * 1000
}, t => {
  let title = `Test ${Math.ceil(999999 * Math.random())}`

  request({
    method: 'POST',
    url: `${PUBLISHER_URL}/`,
    form: {
      title: title,
      content: title
    }
  }, (err, res, body) => {
    assert.ifError(err)
    assert(res.statusCode >= 200 &&
           res.statusCode < 400, 'success status')
    t.pass('triggered, waiting for notification')
  })

  superfeedr.on('notification', (notification) => {
    console.log('notification', notification)
    t.end()
  })
})

tap.tearDown(() => server.close())
