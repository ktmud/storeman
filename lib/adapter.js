/**
 * client get/set API configuration
 */
var after = require('after')

// cached builders by type
var builders = {}

function adapter(client, type) {
  type = type || getClientType(client)
  if (!builders[type]) {
    builders[type] = builder(type)
  }
  return builders[type](client)
}

module.exports = adapter

function getClientType(client) {
  var constructor = client.constructor
  if (constructor) {
    if (constructor.name === 'RedisClient') {
      return 'redis'
    } else if (constructor.name === 'LRUCache') {
      return 'lru-cache'
    }
    if (~constructor.name.toLowerCase().indexOf('level')) {
      // levelup compatible clients
      return 'levelup'
    }
  }
  console.warn('[Storeman]: Unsupported storage client, use default')
  return 'default'
}

/**
 * Generate pseudo class for Storage client
 */
function builder(type) {

  function Storage(client) {
    this.client = client
  }

  var configure = adapter[type] || {}
  var prototype = Storage.prototype

  ;['get', 'set', 'mget', 'del'].forEach(function(method) {
    var fn = configure[method]
    if (!fn) {
      fn = function() {
        var client = this
        if ('function' !== typeof client[method]) {
          throw new Error('Storage client doesnt support ' + method + '()')
        }
        // transparently pass all the arguments the real client
        return client[method].apply(client, arguments)
      }
    }
    prototype[method] = function() {
      return fn.apply(this.client, arguments)
    }
  })

  return function build(client) {
    return new Storage(client);
  }
}

/**
 * To unify how the client handles get / set API
 */
adapter.redis = {
  set: function(key, value, ttl, callback) {
    if (ttl) {
      this.setex(key, ttl, value, callback)
    } else {
      this.set(key, value, callback)
    }
  }
}

adapter.levelup = {
  get: function(key, callback) {
    this.get(key, function(err, value) {
      // notFound is not really an error
      if (err && err.notFound) {
        err = null
        value = null
      }
      if (callback) callback(err, value)
    })
  },
  set: function(key, value, ttl, callback) {
    // the ttl is just ignored
    this.put(key, value, callback)
  },
  del: function(keys, callback) {
    if (keys.length === 1) {
      return this.del(keys[0], callback)
    }
    // batch delete
    var ops = keys.map(function(key) {
      return { type: 'del', key: key }
    })
    this.batch(ops, callback)
  },
  mget: function(keys, callback) {
    var results = []
    var db = this
    var next = after(keys.length, callback)
    keys.forEach(function(key, index) {
      db.get(key, function(err, value) {
        if (err && err.notFound) {
          err = null
          value = null
        }
        if (err) {
          return next(err)
        }
        results[key] = value
        next(null, results)
      })
    })
  }
}

adapter['lru-cache'] = {
  get: function(key, callback) {
    var val = this.get(key)
    if (callback) callback(null, val)
    return val
  },
  set: function(key, value, ttl, callback) {
    var val = this.set(key, value)
    // to reduct complicity, just ignore time to live setting
    if (callback) callback(null, val)
    return val
  },
  del: function(keys, callback) {
    var self = this
    var ret = keys.map(function(key) {
      return self.del(key)
    })
    if (ret.length === 1) {
      if (callback) callback(null, ret[0])
      // LRU cache is sync methods, so we return it directly
      return ret[0]
    }
    if (callback) callback(null, ret)
    return ret
  },
  mget: function(keys, callback) {
    var self = this
    var ret = keys.map(function(key) {
      return self.get(key)
    })
    if (callback) callback(null, ret)
    return ret
  }
}


