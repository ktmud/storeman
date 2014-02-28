/**
 * client get/set API configuration
 */

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
    }
    if (~constructor.name.toLowerCase().indexOf('level')) {
      // levelup compatible clients
      return 'levelup'
    }
  }
  console.warn('Unsupported storage client, use default')
  return 'default'
}

function builder(type) {

  function Client(client) {
    this.client = client
  }

  var configure = adapter[type]
  var proto = Client.prototype

  ;['get', 'set', 'mget', 'del'].forEach(function(method) {
    var fn = configure[method] || function() {
      var client = this
      client[method].apply(client, arguments)
    }
    proto[method] = function() {
      return fn.apply(this.client, arguments)
    }
  })

  return function build(client) {
    return new Client(client);
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
      callback(err, value)
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
  }
}


