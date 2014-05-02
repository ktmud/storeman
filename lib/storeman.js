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
  if (!options || !options.client) {
    throw new Error('Must provide a storage client for storeman')
  }
  this.prefix = options.prefix || '' // no prefix by default
  this.default_ttl = options.ttl
  this._encode = options.encode || jsonize
  this._decode = options.decode || dejsonize
  this.storage = adapter(options.client)
}

Storeman.prototype.debug = debug

/**
 * Get prefixed key
 */
Storeman.prototype._key = function(key) {
  return this.prefix + key
}

Storeman.prototype.set = function set(key, value, ttl, callback) {
  var self = this
  key = self._key(key)
  value = self.encode(value)
  if ('function' == typeof ttl) {
    callback = ttl
    ttl = self.default_ttl
  }
  self.debug('[set]: %s -> %s, expires: %ss', key, value, ttl || 0)
  return self.storage.set(key, value, ttl, callback)
}

Storeman.prototype.decode = function(value) {
  if (value) {
    return this._decode(value)
  }
  // return undefined
}

Storeman.prototype.encode = function(value) {
  return this._encode(value)
}

Storeman.prototype.get = function get(key, callback) {
  var self = this
  key = self._key(key)
  self.debug('[get]: %s', key)
  var ret = self.storage.get(key, function(err, value) {
    value = self.decode(value)
    if (callback) callback(err, value)
  })
  // not null or undefined
  ret = self.decode(ret)
  return ret
}

Storeman.prototype.mget = function multiGet(keys, callback) {
  var self = this
  var prefix = self.prefix
  keys = keys.map(function(item) {
    return prefix + item
  })
  self.debug('[mget]: %j', keys)
  var ret = self.storage.mget(keys, function(err, items) {
    if (items) {
      items = items.map(function(value) {
        return self.decode(value)
      })
    }
    if (callback) callback(err, items)
  })
  // not null or undefined
  if (ret && ret.map) {
    ret = ret.map(function(value) {
      return self.decode(value)
    })
  }
  return ret
}

/**
 * Delete a key, support bulk delete by default
 */
Storeman.prototype.del = function del(keys, callback) {
  var self = this
  var prefix = self.prefix
  if (!Array.isArray(keys)) {
    keys = [keys]
  }
  keys = keys.map(function(item) {
    return prefix + item
  })
  self.debug('[del]: %j', keys)
  return self.storage.del(keys, callback)
}



function jsonize(data) {
  return JSON.stringify(data)
}
function dejsonize(data) {
  return JSON.parse(data)
}


module.exports = Storeman
