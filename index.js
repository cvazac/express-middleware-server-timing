const onHeaders = require('on-headers')
const headerName = 'Server-Timing'

module.exports = function(app, options = {}) {
  const name = options.name || 'mw'
  const description = options.description
  const listen = app.listen

  app.listen = function() {
    // add our middleware to the end
    app.use(function(req, res, next) {
      const startTime = process.hrtime()
      onHeaders(res, function() {
        appendHeader(res, startTime, name, description)
      })

      const timers = {}
      res.serverTimingStart = function(name, description) {
        const startTime = process.hrtime()
        timers[name] = {
          startTime,
          description,
        }
      }

      res.serverTimingStop = function(name) {
        const timer = timers[name]
        if (!timer) {
          console.warn(`no timer named ${name}`)
          return
        }

        appendHeader(this, timer.startTime, name, timer.description)
        delete timers[name]
      }

      res.serverTimingSync = function(method, name, description) {
        const startTime = process.hrtime()
        const returnValue = method()
        appendHeader(this, startTime, name, description)
        return returnValue
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

function appendHeader(res, startTime, name, description) {
  const diff = process.hrtime(startTime)
  const headerString = []
    .concat(res.getHeader(headerName) || [])
    .concat(toServerTimingEntry(name, diff, description))
    .join(',')
  res.setHeader(headerName, headerString)
}