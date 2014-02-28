# Storeman

A man to help you unify API for mischellaneous storage clients.

Provide a handful of of useful methods: `get`, `set`(with ttl), `del`, `mget`. 

With built in Redis and leveldb support.

## Usage

```
var Storeman = require('storeman')
var Redis = require('redis')
var client = Redis.createClient()

var store = new Storeman({
    prefix: 'store:',
    client: client,
    encode: function(data){
        return JSON.stringify(data)
    },
    decode: function(data) {
        return JSON.parse(data)
    }
})
```

## API

The main purpose of this module is to provide a higher level of consistent API over
different storage clients. That means:

  - consistent method name:
  - consistent function signature
  - consistent return results

All methods include:

### store.get(key, callback)

Will `callback(null, undefined)` when no data is found,
not return a `null` or emit an error.

### store.set(key, value, [ttl], callback)

The client is responsible for handling `ttl`, Storeman will not do this for you.

### store.del(key, callback)

Supports batch delete by passing an Array as `key`.


## License

the MIT license.
