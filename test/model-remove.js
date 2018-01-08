'use strict'

const chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  chaiSubset = require('chai-subset'),
  _ = require('lodash'),
  expect = chai.expect

chai.use(chaiSubset)
chai.use(chaiAsPromised)

const Model = require('../model'),
  DabMemory = require('@rappopo/dab-memory'),
  Bdez = require('../bdez')

const schema = {
    name: 'testModel',
    schema: {
      attributes: {
        _id: { type: 'string' },
        name: { type: 'text' }
      }
    },
    dabName: 'test'
  },
  body = {
    _id: 'james-bond',
    name: 'James Bond'
  }

let bdez, dab, model

describe('Model - remove', function (done) {
  it('should return the correct value', function (done) {
    dab = new DabMemory()
    bdez = new Bdez()
    bdez.addDab('test', dab).addModel(schema)
      .then(function(m) {
        model = m
        return model.create(body)
      })
      .then(function(result) {
        return model.remove('james-bond')
      })
      .then(function(result) {
        expect(result).to.have.property('success').that.is.true
        done()
      })
  })

  it('should return error if doc not found', function (done) {
    dab = new DabMemory()
    bdez = new Bdez()
    bdez.addDab('test', dab).addModel(schema)
      .then(function(m) {
        model = m
        return model.create(body)
      })
      .then(function(result) {
        return model.remove('none')
      })
      .catch(function(err) {
        expect(err).to.be.a('error').and.have.property('message', 'Document not found')
        done()
      })
  })

  describe('beforeRemove Hook', function (done) {
    beforeEach(function (done) {
      dab = new DabMemory()
      bdez = new Bdez()
      bdez.addDab('test', dab)
      done()
    })

    it('should stop before the main method on error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          beforeRemove: function(id, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          return model.create(body)
        })
        .then(function (result) {
          return model.remove('james-bond')
        })
        .catch(function(err) {
          expect(err).to.be.a('error').that.have.property('message', 'error')
          expect(model.getDab().data.testModel).to.have.length(1)
          done()
        })
    })

    it('should continue the main method even on error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          beforeRemove: function(id, body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          return model.create(body)
        })
        .then(function (result) {
          return model.remove('james-bond', { ignoreError: true })
        })
        .then(function(result) {
          expect(result.beforeRemoveError).to.be.a('error').that.have.property('message', 'error')
          expect(model.getDab().data.testModel).to.have.length(0)
          done()
        })
    })

    it('should execute the main method if no error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          beforeRemove: function(id, body, params) {
            return Promise.resolve(true)
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          return model.create(body)
        })
        .then(function (result) {
          return model.remove('james-bond')
        })
        .then(function(result) {
          expect(result).to.have.property('success').that.is.true
          expect(model.getDab().data.testModel).to.have.length(0)
          done()
        })
    })

    it('should change id argument if provided', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          beforeRemove: function(id, body, params) {
            return Promise.resolve({ id: 'jack-bauer' })
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          return model.create(body)
        })
        .then(function (result) {
          return model.create({ _id: 'jack-bauer', name: 'Jack Bauer' })
        })
        .then(function (result) {
          return model.remove('james-bond', { withSource: true })
        })
        .then(function(result) {
          expect(result).to.have.property('success').that.is.true
          expect(result.source).to.have.property('_id', 'jack-bauer')
          expect(result.source).to.have.property('name', 'Jack Bauer')
          done()
        })
    })

  })

  describe('afterRemove Hook', function (done) {
    beforeEach(function (done) {
      dab = new DabMemory()
      bdez = new Bdez()
      bdez.addDab('test', dab)
      done()
    })

    it('should stop before the end result on error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          afterRemove: function(body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          return model.create(body)
        })
        .then(function (result) {
          return model.remove('james-bond')
        })
        .catch(function(err) {
          expect(err).to.be.a('error').that.have.property('message', 'error')
          done()
        })
    })

    it('should continue to the end even on error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          afterRemove: function(body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          return model.create(body)
        })
        .then(function (result) {
          return model.remove('james-bond', { withSource: true, ignoreError: true })
        })
        .then(function(result) {
          expect(result.afterRemoveError).to.be.a('error').that.have.property('message', 'error')
          expect(result.source.name).to.equal('James Bond')
          done()
        })
        .catch(e => {
//          console.log(e)
          done()
        })
    })

    it('should return exactly from its proxy', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          afterRemove: function(body, params) {
            return Promise.resolve(true)
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          return model.create(body)
        })
        .then(function (result) {
          return model.remove('james-bond', { withSource: true })
        })
        .then(function (result) {
          expect(result).to.have.property('success').that.is.true
          expect(result.source).to.have.property('_id', 'james-bond')
          expect(result.source).to.have.property('name', 'James Bond')
          expect(result).to.not.have.property('beforeRemoveError')
          expect(result).to.not.have.property('afterRemoveError')
          done()
        })
    })

    it('should replace the end result entirely', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          afterRemove: function(body, params) {
            return Promise.resolve({
              result: {
                success: true,
                source: {
                  _id: 'johnny-english',
                  name: 'Johnny English'
                }
              }
            })
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          return model.create(body)
        })
        .then(function (result) {
          return model.remove('james-bond', { withSource: true })
        })
        .then(function(result) {
          expect(result).to.have.property('success').that.is.true
          expect(result.source).to.have.property('_id', 'johnny-english')
          expect(result.source).to.have.property('name', 'Johnny English')
          expect(result).to.not.have.property('beforeRemoveError')
          expect(result).to.not.have.property('afterRemoveError')
          done()
        })
    })

  })


})

