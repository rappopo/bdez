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

describe('Model - find', function (done) {
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
    model.find({ query: { _id: 'james-bond' }})
      .then(function(result) {
        expect(result).to.have.property('success').that.is.true
        expect(result.data).to.have.length(1)   
        expect(result.data[0]).to.have.property('_id', 'james-bond')
        expect(result.data[0]).to.have.property('name', 'James Bond')
        done()
      })
  })

  it('should return empty if no doc found', function (done) {
    model.find({ query: { _id: 'none' }})
      .then(function(result) {
        expect(result).to.have.property('success').that.is.true
        expect(result.data).to.have.length(0)
        expect(result.total).to.equal(0)
        done()
      })
  })


})

