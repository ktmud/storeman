var should = require('should')
var Storeman = require('../')
var LRU = require('lru-cache')

describe('Storeman', function() {

  var store, client

  before(function() {
    client = LRU()
    store = new Storeman({ client: client })
  })

  describe('initialize', function() {

    it('should throw error when no client provided', function() {
      var err
      try {
        new Storeman()
      } catch (e) {
        err = e
      }
      should.exist(err)
    })

    it('should have public option data', function() {
      should.exist(store.storage)
      should.exist(store.encode)
      should.exist(store.decode)
    })

  })

  describe('set', function() {

    beforeEach(function() {
      store = new Storeman({ client: client, prefix: 'abc' })
    })

    it('should have prefix', function() {
      store.prefix.should.equal('abc')
      store.set('haha', 1)
      client.keys().should.include('abchaha')
    })

    it('can set multiple time', function() {
      store.set('wawa', { test: 1 })
      store.set('kaka', 2)
    })

  })

  describe('get', function() {

    it('can get one', function() {
      store.get('wawa').should.eql({ test: 1 })
      store.get('kaka')
    })

    it('can mget', function() {
      store.mget(['wawa', 'kaka']).should.eql([{ test: 1 }, 2])
    })

    it('can async get', function(done) {
      store.get('wawa', function(err, result) {
        should.not.exist(err)
        result.should.eql({ test: 1 })
        done()
      })
    })

    it('can async mget', function(done) {
      store.mget(['wawa', 'kaka'], function(err, result) {
        should.not.exist(err)
        result.should.eql([{ test: 1 }, 2])
        done()
      })
    })

  })

  describe('del', function() {

    it('can delete one', function() {
      should.exist(store.get('haha'))
      store.del('haha')
      should.not.exist(store.get('haha'))
    })

    it('can delete many', function() {
      store.mget(['wawa', 'kaka']).should.eql([{ test: 1 }, 2])
      store.del(['wawa', 'kaka'])
      should(store.get('wawa')).equal(undefined)
    })

  })

})
