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

describe('Model - update', function (done) {
  it('should return the correct value', function (done) {
    dab = new DabMemory()
    bdez = new Bdez()
    bdez.addDab('test', dab).addModel(schema)
      .then(function(m) {
        model = m
        return model.create(body)
      })
      .then(function(result) {
        return model.update('james-bond', { name: 'Jamie Blondy' })
      })
      .then(function(result) {
        expect(result).to.have.property('success').that.is.true
        expect(result.data).to.have.property('_id', 'james-bond')
        expect(result.data).to.have.property('name', 'Jamie Blondy')
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
        return model.update('none', { name: 'Jamie Blondy' })
      })
      .catch(function(err) {
        expect(err).to.be.a('error').and.have.property('message', 'Document not found')
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
        name: 'James Bond'
      }
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          model.getDab().data.testModel.push(body)
          return model.update('james-bond', newBody)
        })
        .catch(function(err) {
          expect(err).to.be.a('error').that.have.property('message', 'error')
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
        .then(function (m) {
          model = m
          model.getDab().data.testModel.push(body)
          return model.update('james-bond', newBody, { ignoreError: true })
        })
        .then(function(result) {
          expect(result.beforeValidateError).to.be.a('error').that.have.property('message', 'error')
          expect(result.data).to.eql(newBody)
          done()
        })
    })

    it('should stop on validation error', function (done) {
      const newBody = { 
        name: 'Jamie Blondy',
        email: 'test'
      }
      bdez.addModel(schemaValidated)
        .then(function (m) {
          model = m
          model.getDab().data.testModel.push(body)
          return model.update('james-bond', newBody)
        })
        .catch(function(err) {
          expect(err).to.be.a('error').that.have.property('message', 'Validation error')
          expect(err.details.email).to.include('isEmail')
          done()
        })
    })

    it('should validate successfully', function (done) {
      const newBody = { 
        name: 'Jamie Blondy',
        email: 'james@bond.com'
      }
      bdez.addModel(schemaValidated)
        .then(function (m) {
          model = m
          model.getDab().data.testModel.push(body)
          return model.update('james-bond', newBody)
        })
        .then(function (result) {
          expect(result).to.have.property('success', true)
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
          model.getDab().data.testModel.push(body)
          return model.update('james-bond', newBody)
        })
        .catch(function(err) {
          expect(err).to.be.a('error').that.have.property('message', 'error')
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
        .then(function (m) {
          model = m
          model.getDab().data.testModel.push(body)
          return model.update('james-bond', newBody, { ignoreError: true })
        })
        .then(function(result) {
          expect(result.afterValidateError).to.be.a('error').that.have.property('message', 'error')
          expect(result.data).to.eql(newBody)
          done()
        })
    })

  })

  describe('beforeUpdate Hook', function (done) {
    beforeEach(function (done) {
      dab = new DabMemory()
      bdez = new Bdez()
      bdez.addDab('test', dab)
      done()
    })

    it('should stop before the main method on error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          beforeUpdate: function(id, body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          model.getDab().data.testModel.push(body)
          return model.update('james-bond', { name: 'Jamie Blondy' })
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
          beforeUpdate: function(id, body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          model.getDab().data.testModel.push(body)
          return model.update('james-bond', { name: 'Jamie Blondy' }, { ignoreError: true })
        })
        .then(function(result) {
          expect(result.beforeUpdateError).to.be.a('error').that.have.property('message', 'error')
          expect(result.data).to.eql({ _id: 'james-bond', name: 'Jamie Blondy' })
          done()
        })
    })

    it('should execute the main method if no error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          beforeUpdate: function(id, body, params) {
            return Promise.resolve(true)
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          model.getDab().data.testModel.push(body)
          return model.update('james-bond', { name: 'Jamie Blondy' })
        })
        .then(function(result) {
          expect(result).to.have.property('success').that.is.true
          expect(result.data).to.have.property('_id', 'james-bond')
          expect(result.data).to.have.property('name', 'Jamie Blondy')
          done()
        })
    })

    it('should change body argument if provided', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          beforeUpdate: function(id, body, params) {
            return Promise.resolve({ body: { name: 'James Bond 007' }})
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          model.getDab().data.testModel.push(body)
          return model.update('james-bond', { name: 'Jamie Blondy' })
        })
        .then(function(result) {
          expect(result).to.have.property('success').that.is.true
          expect(result.data).to.have.property('_id', 'james-bond')
          expect(result.data).to.have.property('name', 'James Bond 007')
          done()
        })
    })

  })

  describe('afterUpdate Hook', function (done) {
    beforeEach(function (done) {
      dab = new DabMemory()
      bdez = new Bdez()
      bdez.addDab('test', dab)
      done()
    })

    it('should stop before the end result on error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          afterUpdate: function(body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          model.getDab().data.testModel.push(body)
          return model.update('james-bond', { name: 'Jamie Blondy' })
        })
        .catch(function(err) {
          expect(err).to.be.a('error').that.have.property('message', 'error')
          done()
        })
    })

    it('should continue to the end even on error', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          afterUpdate: function(body, params) {
            return Promise.reject(new Error('error'))
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          model.getDab().data.testModel.push(body)
          return model.update('james-bond', { name: 'Jamie Blondy' }, { ignoreError: true })
        })
        .then(function(result) {
          expect(result.afterUpdateError).to.be.a('error').that.have.property('message', 'error')
          expect(result.data.name).to.equal('Jamie Blondy')
          done()
        })
    })

    it('should return exactly from its proxy', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          afterUpdate: function(body, params) {
            return Promise.resolve(true)
          }
        }
      })
      bdez.addModel(newSchema)
        .then(function (m) {
          model = m
          model.getDab().data.testModel.push(body)
          return model.update('james-bond', { name: 'Jamie Blondy' })
        })
        .then(function (result) {
          expect(result).to.have.property('success').that.is.true
          expect(result.data).to.have.property('_id', 'james-bond')
          expect(result.data).to.have.property('name', 'Jamie Blondy')
          expect(result).to.not.have.property('beforeUpdateError')
          expect(result).to.not.have.property('afterUpdateError')
          done()
        })
    })

    it('should replace the end result entirely', function (done) {
      const newSchema = _.merge(_.cloneDeep(schema), {
        hook: {
          afterUpdate: function(body, params) {
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
        .then(function (m) {
          model = m
          model.getDab().data.testModel.push(body)
          return model.update('james-bond', { name: 'Jamie Blondy' })
        })
        .then(function(result) {
          expect(result).to.have.property('success').that.is.true
          expect(result.data).to.have.property('_id', 'johnny-english')
          expect(result.data).to.have.property('name', 'Johnny English')
          expect(result).to.not.have.property('beforeUpdateError')
          expect(result).to.not.have.property('afterUpdateError')
          done()
        })
    })

  })

})

