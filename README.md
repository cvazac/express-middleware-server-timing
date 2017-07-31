# express-middleware-server-timing

Automagic expressjs middleware performance monitoring.

## Installation

```sh
npm install --save express-middleware-server-timing
```

## Usage

```js
const app = express()

// any time later
require('express-middleware-server-timing')(app)
```

A server-timing entry named `mw` will be generated for every request that passes through express. 

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

