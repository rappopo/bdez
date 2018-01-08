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
      fields: [
        { id: '_id', type: 'string' },
        { id: 'name', type: 'text' }
      ]
    },
    dabName: 'test'
  },
  body = {
    _id: 'james-bond',
    name: 'James Bond'
  }

let bdez, dab, model

describe('Model - findOne', function (done) {
  beforeEach(function (done) {
    dab = new DabMemory()
    bdez = new Bdez()
    bdez.addDab('test', dab).addModel(schema)
      .then(function(m) {
        model = m
        return model.create(body)
      })
      .then(function(result) {
        done()
      })
  })


  it('should return the correct value', function (done) {
    model.findOne('james-bond')
      .then(function(result) {
        expect(result).to.have.property('success').that.is.true
        expect(result.data).to.have.property('_id', 'james-bond')
        expect(result.data).to.have.property('name', 'James Bond')
        done()
      })
  })

  it('should return error if doc not found', function (done) {
    model.findOne('none')
      .catch(function(err) {
        expect(err).to.be.a('error').and.have.property('message', 'Document not found')
        done()
      })
  })


})

