# express-middleware-server-timing

Automagic expressjs middleware performance monitoring.

There are many server-timing libraries out there for expressjs, but I couldn't find any that provided any out-of-the-box value. 

## Installation

```sh
npm install --save express-middleware-server-timing
```

## Usage

```js
const app = express()

// any time before `app.listen(...)`
require('express-middleware-server-timing')(app, [options])
```

The following table describes the properties of the `options` object.

| Property      | Description                             | Type   | Default     |
|---------------|-----------------------------------------|--------|-------------|
| `name`        | name of the server timing metric        | String | 'mw'        |
| `description` | description of the server timing metric | String | `undefined` |
| `active`      | set `false` if you want to disable      | Boolean| `true`      |

A server-timing entry named `<name>` (with optional description of `<description>`) will be generated for every request that passes through express.

## Manual instrumentation

### serverTimingStart / serverTimingStop
To create a server-timing entry reporting the duration between two check points of the same response, try:

```javascript

app.get(path, function (req, res, next) {
  res.serverTimingStart('foo', 'bar')

  // some time later, maybe in different middleware handler
  res.serverTimingStop('foo')

  // ...
})
```
A header like this will be written to the response:
```
Server-Timing: foo; dur=[time in ms]; desc="bar"
```

### serverTimingSync
To create a server-timing entry reporting the duration it took to execute a syncronous method, try:
```javascript
app.get(path, function (req, res, next) {
  const result = res.serverTimingSync(function() {
    // slow syncronous code here
  }, 'slowMethod1', 'sometimes this method is slow')

  // ...
})
```

A header like this will be written to the response:
```
Server-Timing: slowMethod1; dur=[time in ms]; desc="sometimes this method is slow"
```

## Browser Collection

For browsers that suport server-timing (Chrome 65+, Opera 52+), the entries can be accessed like this:
```javascript
['navigation', 'resource']
  .forEach(function(entryType) {
    performance.getEntriesByType(entryType).forEach(function({name: url, serverTiming}) {
      serverTiming.forEach(function({name, duration, description}) {
        console.info('expressjs middleware =',
          JSON.stringify({url, entryType, name, duration, description}, null, 2))
      })
    })
})
```

## Decide to use it regarding to running environment

```javascript
require('express-middleware-server-timing')(app, {
  active: process.env.NODE_ENV === 'development'
})
```

## License

MIT
