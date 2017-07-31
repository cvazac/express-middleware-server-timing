const onHeaders = require('on-headers')

module.exports = function(app) {
  app.use(function(req, res, next) {
    var startTime = process.hrtime()
    onHeaders(res, function() {
      const diff = process.hrtime(startTime)
      const headerString = []
        .concat(this.getHeader('Server-Timing') || [])
        .concat(`mw=${diff[0] * 1e3 + diff[1] / 1e6}`).join(',')
      this.setHeader('Server-Timing', headerString)
    })

    next()
  })

  // move the Layer we just added from last to first
  // yes, this is probably a bad idea that won't work forever, but...
  app._router.stack.unshift(app._router.stack.pop())
}
