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
  schemaValidated = {
    name: 'testModel',
    schema: {
      attributes: {
        _id: { type: 'string', validator: { required: true }},
        name: { type: 'string', validator: { required: true }},        
        email: { type: 'string', validator: { required: true, isEmail: true }},
      }
    },
    dabName: 'test'
  },
  body = {
    _id: 'james-bond',
    name: 'James Bond'
  }

let bdez, dab, model

describe('Model - create', function (done) {
  it('should return the correct value', function (done) {
    dab = new DabMemory()
    bdez = new Bdez()
    bdez.addDab('test', dab).addModel(schema)
      .then(function(model) {
        return model.create(body)
      })
      .then(function(result) {
        expect(result).to.have.property('success').that.is.true
        expect(result.data).to.have.property('_id', 'james-bond')
        expect(result.data).to.have.property('name', 'James Bond')
        done()
      })
  })

  it('should return error if doc exists', function (done) {
    dab = new DabMemory()
    bdez = new Bdez()
    bdez.addDab('test', dab).addModel(schema)
      .then(function (m) {
        model = m
        return model.create(body)
      })        
      .then(function (result) {
        return model.create(body)
      })
      .catch(function (err) {
        expect(err).to.be.a('error').that.have.property('message', 'Document already exists')
        done()
      })
  })

  describe('beforeValidate Hook', function (done) {
    beforeEach(function (done) {
      dab = new DabMemory()
      bdez = new Bdez()
      bdez.addDab('test', dab)
      done()
    })

    it('should stop even before validation', function (done) {
      const newSchema = _.merge(_.cloneDeep(schemaValidated), {
        hook: {
          beforeValidate: function(body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      const newBody = { 
        _id: 'james-bond',
        email: 'james@bond'
      }
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          return model.create(newBody)
        })
        .catch(function(err) {
          expect(err).to.be.a('error').that.have.property('message', 'error')
          expect(model.getDab().data.testModel).to.have.length(0)
          done()
        })
    })

    it('should continue to validate even on error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          beforeValidate: function(body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      const newBody = { 
        _id: 'james-bond',
        name: 'James Bond'
      }
      bdez.addModel(newSchema)
        .then(function (model) {
          return model.create(newBody, { ignoreError: true })
        })
        .then(function(result) {
          expect(result.beforeValidateError).to.be.a('error').that.have.property('message', 'error')
          expect(result.data).to.eql(newBody)
          done()
        })
    })

    it('should stop on validation error', function (done) {
      bdez.addModel(schemaValidated)
        .then(function (m) {
          model = m
          return model.create({ 
            _id: 'james-bond',
            email: 'james@bond'
          })
        })
        .catch(function(err) {
          expect(err).to.be.a('error').that.have.property('message', 'Validation error')
          expect(err.details.name).to.include('required')
          expect(err.details.email).to.include('isEmail')
          expect(model.getDab().data.testModel).to.have.length(0)
          done()
        })
    })


  })

  describe('afterValidate Hook', function (done) {
    beforeEach(function (done) {
      dab = new DabMemory()
      bdez = new Bdez()
      bdez.addDab('test', dab)
      done()
    })

    it('should stop after validation', function (done) {
      const newSchema = _.merge(_.cloneDeep(schemaValidated), {
        hook: {
          afterValidate: function(body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      const newBody = { 
        _id: 'james-bond',
        name: 'James Bond',
        email: 'james@bond.com'
      }
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          return model.create(newBody)
        })
        .catch(function(err) {
          expect(err).to.be.a('error').that.have.property('message', 'error')
          expect(model.getDab().data.testModel).to.have.length(0)
          done()
        })
    })

    it('should continue to the main method even on error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schemaValidated), {
        hook: {
          afterValidate: function(body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      const newBody = { 
        _id: 'james-bond',
        name: 'James Bond',
        email: 'james@bond.com'
      }
      bdez.addModel(newSchema)
        .then(function (model) {
          return model.create(newBody, { ignoreError: true })
        })
        .then(function(result) {
          expect(result.afterValidateError).to.be.a('error').that.have.property('message', 'error')
          expect(result.data).to.eql(newBody)
          done()
        })
    })

  })

  describe('beforeCreate Hook', function (done) {
    beforeEach(function (done) {
      dab = new DabMemory()
      bdez = new Bdez()
      bdez.addDab('test', dab)
      done()
    })

    it('should stop before the main method on error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          beforeCreate: function(body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          return model.create(body)
        })
        .catch(function(err) {
          expect(err).to.be.a('error').that.have.property('message', 'error')
          expect(model.getDab().data.testModel).to.have.length(0)
          done()
        })
    })

    it('should continue the main method even on error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          beforeCreate: function(body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (model) {
          return model.create(body, { ignoreError: true })
        })
        .then(function(result) {
          expect(result.beforeCreateError).to.be.a('error').that.have.property('message', 'error')
          expect(result.data).to.eql(body)
          done()
        })
    })

    it('should execute the main method if no error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          beforeCreate: function(body, params) {
            return Promise.resolve(true)
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (model) {
          return model.create(body)
        })
        .then(function(result) {
          expect(result).to.have.property('success').that.is.true
          expect(result.data).to.have.property('_id', 'james-bond')
          expect(result.data).to.have.property('name', 'James Bond')
          done()
        })
    })

    it('should change body argument if provided', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          beforeCreate: function(body, params) {
            return Promise.resolve({ body: { _id: 'jack-bauer', name: 'Jack Bauer' }})
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (model) {
          return model.create(body)
        })
        .then(function(result) {
          expect(result).to.have.property('success').that.is.true
          expect(result.data).to.have.property('_id', 'jack-bauer')
          expect(result.data).to.have.property('name', 'Jack Bauer')
          done()
        })
    })

  })

  describe('afterCreate Hook', function (done) {
    beforeEach(function (done) {
      dab = new DabMemory()
      bdez = new Bdez()
      bdez.addDab('test', dab)
      done()
    })

    it('should stop before the end result on error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          afterCreate: function(body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (model) {
          return model.create(body)
        })
        .catch(function(err) {
          expect(err).to.be.a('error').that.have.property('message', 'error')
          done()
        })
    })

    it('should continue to the end even on error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          afterCreate: function(body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (model) {
          return model.create(body, { ignoreError: true })
        })
        .then(function(result) {
          expect(result.afterCreateError).to.be.a('error').that.have.property('message', 'error')
          expect(result.data).to.eql(body)
          done()
        })
    })

    it('should return exactly from its proxy', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          afterCreate: function(body, params) {
            return Promise.resolve(true)
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (model) {
          return model.create(body)
        })
        .then(function (result) {
          expect(result).to.have.property('success').that.is.true
          expect(result.data).to.have.property('_id', 'james-bond')
          expect(result.data).to.have.property('name', 'James Bond')
          expect(result).to.not.have.property('beforeCreateError')
          expect(result).to.not.have.property('afterCreateError')
          done()
        })
    })

    it('should replace the end result entirely', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          afterCreate: function(body, params) {
            return Promise.resolve({
              result: {
                success: true,
                data: {
                  _id: 'johnny-english',
                  name: 'Johnny English'
                }
              }
            })
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (model) {
          return model.create(body)
        })
        .then(function(result) {
          expect(result).to.have.property('success').that.is.true
          expect(result.data).to.have.property('_id', 'johnny-english')
          expect(result.data).to.have.property('name', 'Johnny English')
          expect(result).to.not.have.property('beforeCreateError')
          expect(result).to.not.have.property('afterCreateError')
          done()
        })
    })

  })



})

