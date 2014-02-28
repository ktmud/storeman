# Storeman

A man to help you unify API for mischellaneous storage engines.

Provide a handful set of of useful methods: `get`, `set` *(with ttl)*, `del`, `mget`. 

With built in [Redis](https://github.com/mranney/node_redis/) and
[LevelUP](https://github.com/rvagg/node-levelup) support.

## Usage

```
var Storeman = require('storeman')
var Redis = require('redis')
var levelup = require('levelup')

// cache with Redis
var cache = new Storeman({
    prefix: 'cache:',
    client: Redis.createClient(),
    encode: function(data){
        return JSON.stringify(data)
    },
    decode: function(data) {
        return JSON.parse(data)
    }
})

// persistent storage with leveldb
var store = new Storeman({
    prefix: 'store:',
    client: levelup('./var/leveldb')
})
```

## API

The main purpose of this module is to provide a higher level of consistent API over
different storage clients. That means:

  - consistent method name
  - consistent function signature
  - consistent return results

All methods include:

### store.get(key, callback)

Will `callback(null, undefined)` when no data is found,
not return a `null` (as redis does) or emit an error (as leveldb does).

### store.set(key, value, [ttl], callback)

The client is responsible for handling `ttl`, Storeman will not do this for you.

### store.del(key, callback)

Supports batch delete by passing an Array as `key`.


## License

the MIT license.
