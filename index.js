const onHeaders = require('on-headers')
const headerName = 'Server-Timing'

module.exports = function(app, options = {}) {
  const name = options.name || 'mw'
  const listen = app.listen

  app.listen = function() {
    // add our middleware to the end
    app.use(function(req, res, next) {
      const startTime = process.hrtime()
      onHeaders(res, function() {
        const diff = process.hrtime(startTime)
        const headerString = []
          .concat(this.getHeader(headerName) || [])
          .concat(toServerTimingEntry(name, diff))
          .join(',')
        this.setHeader(headerName, headerString)
      })

      res.serverTimingSync = function(method, name, description) {
        const startTime = process.hrtime()
        method()
        const diff = process.hrtime(startTime)
        this.setHeader(headerName,
          toServerTimingEntry(name, diff, description))
      }

      next()
    })

    // move the Layer we just added from last to first
    // yes, this is probably a bad idea that won't work forever, but...
    app._router.stack.unshift(app._router.stack.pop())

    // let the listening begin
    listen.apply(app, arguments)
  }
}

function toServerTimingEntry(name, diff, description) {
  let entry = `${name}=${diff[0] * 1e3 + diff[1] / 1e6}`
  if (description) {
    entry += `; ${JSON.stringify(description)}`
  }
  return entry
}
