'use strict'

import tap from 'tap'
import assert from 'assert'
import http from 'http'
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

const EXAMPLE_FEED_1 = 'https://www.c3d2.de/news-atom.xml'

tap.test('subscribe a feed', t => {
  superfeedr.subscribe(EXAMPLE_FEED_1, (err) => {
    assert.ifError(err)
    t.end()
  })
})

tap.test('list subscribed feeds', t => {
  superfeedr.list({}, (err, json) => {
    assert.ifError(err)
    assert.ok(json)
    assert(json.constructor === Array)
    assert(json.length >= 1)  // [..., EXAMPLE_FEED_1]
    t.end()
  })
})

// TODO: to test pagination, subscribe to many feeds before
tap.test('stream subscriptions', t => {
  let stream = superfeedr.streamSubscriptions()
  let data_count = 0
  let hit_count = 0
  stream.on('data', (item) => {
    data_count += 1
    if (item.subscription.feed.url === EXAMPLE_FEED_1) {
      hit_count += 1
    }
  })
  stream.on('end', () => {
    assert(data_count > 0, 'emitted \'data\'')
    assert(hit_count === 1, 'emitted EXAMPLE_FEED_1')
    t.end()
  })
})

tap.test('retrieve a feed', t => {
  superfeedr.retrieve(EXAMPLE_FEED_1, (err, result) => {
    assert.ifError(err)
    assert.equal(result.status.feed, EXAMPLE_FEED_1)
    t.end()
  })
})

tap.test('unsubscribe a feed', t => {
  superfeedr.unsubscribe(EXAMPLE_FEED_1, (err) => {
    assert.ifError(err)
    t.end()
  })
})

tap.tearDown(() => server.close())
