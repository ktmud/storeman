var debug = require('debug')('storeman:debug')
var adapter = require('./adapter')

/**
 * Cache storage API, handles the prefix and
 * how to decode and encode data
 *
 * Options:
 *
 *      `client`: a storage backend, typically a Redis client
 *      `encode`: how to encode a `set` value, default to JSON.stringify
 *      `decode`: how to decode a `get` value, default to JSON.parse
 *
 */
function Storeman(options) {
  options = options || {}
  this.prefix = options.prefix || '' // no prefix by default
  this.default_ttl = options.ttl
  this.pickle = options.encode || jsonize
  this.unpickle = options.decode || dejsonize
  if (!options.client) {
    throw new Error('Must provide a storage client for storeman')
  }
  this.client = adapter(options.client)
}

Storeman.prototype.debug = debug

Storeman.prototype.set = function set(key, value, ttl, callback) {
  var _this = this
  key = _this.prefix + key
  value = _this.pickle(value)
  if ('function' == typeof ttl) {
    callback = ttl
    ttl = _this.default_ttl
  }
  _this.debug('[set]: %s -> %s, expires: %ss', key, value, ttl || 0)
  _this.client.set(key, value, ttl, callback)
}

Storeman.prototype.get = function get(key, callback) {
  var _this = this
  key = _this.prefix + key
  _this.debug('[get]: %s', key)
  _this.client.get(key, function(err, value) {
    if (value) {
      value = _this.unpickle(value)
    } else {
      value = undefined
    }
    callback(err, value)
  })
}

Storeman.prototype.mget = function multiGet(keys, callback) {
  var _this = this
  var prefix = _this.prefix
  keys = keys.map(function(item) {
    return prefix + item
  })
  _this.debug('[mget]: %j', keys)
  _this.client.mget(keys, function(err, items) {
    if (items) {
      items = items.map(function(value) {
        return value ? _this.unpickle(value) : undefined
      })
    }
    callback(err, items)
  })
}

Storeman.prototype.del = function del(keys, callback) {
  var _this = this
  var prefix = _this.prefix
  if (!Array.isArray(keys)) {
    keys = [keys]
  }
  keys = keys.map(function(item) {
    return prefix + item
  })
  _this.debug('[del]: %j', keys)
  _this.client.del(keys, callback)
}



function jsonize(data) {
  return JSON.stringify(data)
}
function dejsonize(data) {
  return JSON.parse(data)
}


module.exports = Storeman
