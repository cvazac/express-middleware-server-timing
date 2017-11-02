const onHeaders = require('on-headers')
const headerName = 'Server-Timing'

module.exports = function(app, options = {}) {
  const listen = app.listen
  let responseMethods = {}

  app.listen = function () {
    const layerCount = app._router.stack.length
    const Layer = app._router.stack[0].constructor

    function addLayerAtIndex(index, handler) {
      app._router.stack.splice(index, 0,
        new Layer('*', {sensitive: false, strict: false, end: false}, handler))
    }

    addLayerAtIndex(0, function(req, res, next) {
      const timers = {}
      res.serverTimingStart = function (name, description) {
        const startTime = process.hrtime()
        timers[name] = {
          startTime,
          description,
        }
      }

      res.serverTimingStop = function (name) {
        const timer = timers[name]
        if (!timer) {
          console.warn(`no timer named ${name}`)
          return
        }

        maybeAppendHeader(this, timer.startTime, name, timer.description)
        delete timers[name]
      }

      res.serverTimingSync = function (method, name, description) {
        const startTime = process.hrtime()
        const returnValue = method()
        maybeAppendHeader(this, startTime, name, description)
        return returnValue
      }

      onHeaders(res, function() {
        stopTimer(res, 'onHeaders')
      })

      next()
    })

    for (let i = 1; i <= layerCount; i++) {
      const layer = app._router.stack[i]
      const handle = layer.handle
      const {name, description} = parseLayer(layer)
      console.info('load layer', i, {name, description})

      const debug = {name, description}

      if (layer.handle.length === 4) {
        // skip error middleware
        continue
      }

      layer.handle = function (req, res, next) {
        res._inFlightLayer = {name, description, hrtime: process.hrtime()}

        console.info('start', {name, description})
        handle.call(app, req, res, function() {
          stopTimer(res, 'next')
          next.apply(undefined, arguments)
        })
      }
    }

    // let the listening begin
    listen.apply(app, arguments)
  }
}

function maybeAppendHeader(res, startTime, name, description, filter) {
  const diff = process.hrtime(startTime)
  const duration = diff[0] * 1e3 + diff[1] / 1e6
  if (filter && !filter(duration)) {
    return;
  }

  let entry = `${name.replace(/ /g, '-')}=${duration}`
  if (description) {
    entry += `; ${JSON.stringify(description)}`
  }

  const headerString = []
    .concat(res.getHeader(headerName) || [])
    .concat(entry)
    .join(',')
  res.setHeader(headerName, headerString)
}

let boundDispatchIndex = 0
function parseLayer(layer) {
  let {name} = layer
  let description
  console.info('outer', layer)
  if (name === 'bound dispatch') {
    var x = layer.route.stack.reduce(function(names, layer) {
      console.info('inner', layer)
      names.push(layer.name)
      return names
    }, [])
    console.info(x)

    name = `${name}${boundDispatchIndex++}`
    description =
      `${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`
  }

  return {
    name,
    description
  }
}

function stopTimer(res, who) {
  if (!res._inFlightLayer) {
    return
  }

  console.info(`${who} was called`, res._inFlightLayer)
  const {hrtime, name, description} = res._inFlightLayer
  delete res._inFlightLayer
  maybeAppendHeader(res, hrtime, name, description, function(duration) {
    return duration > 1 // TODO change to > 1
  })
}
