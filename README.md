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

// any time later
require('express-middleware-server-timing')(app, [options])
```

The following table describes the properties of the `options` object.

| Property | Description                      | Type   | Default |
|----------|----------------------------------|--------|---------|
| `name`   | name of the server timing metric | String | "mw"    |

A server-timing entry named `<name>` will be generated for every request that passes through express.

## Manual instrumentation

To create a server-timing entry reporting the time it took to execute a syncronous method, try:
```javascript
serverTimingSync(function() {
  // slow syncronous code here
}, 'slowMethod1', 'sometimes this method is slow')
```

That yields this header:
```
Server-Timing: slowMethod1=[time in ms]; "sometimes this method is slow"
```

## In browser

For browsers that suport server-timing (currently only [Chrome Canary](https://www.google.com/chrome/browser/canary.html)), the entries can be accessed like this:
```javascript
['navigation', 'resource']
  .forEach(function(entryType) {
    performance.getEntriesByType(entryType).forEach(function({name: url, serverTiming}) {
      serverTiming.find(function({name, duration}) {
        if (name === 'mw') {
          console.info('expressjs middleware =', JSON.stringify({url, entryType, duration}, null, 2))
          return true
        }
      })
    })
})
```

## License

MIT

