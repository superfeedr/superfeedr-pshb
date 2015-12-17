'use strict'

import stream from 'stream'

class SubscriptionsStream extends stream.Readable {
  constructor (superfeedr, opts) {
    super({ objectMode: true })

    this.superfeedr = superfeedr
    this.opts = opts || {}
    if (!this.opts.page) {
      this.opts.page = 1
    }
  }

  _read () {
    if (this.reading) return
    this.reading = true

    this.superfeedr.list(this.opts, (err, results) => {
      this.reading = false
      if (err) {
        return this.emit('error', err)
      }

      if (results.length > 0) {
        this.opts.page += 1
        results.forEach((result) => this.push(result))
      } else {
        // EOF
        this.push(null)
      }
    })
  }
}

export default SubscriptionsStream
