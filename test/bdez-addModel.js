'use strict'

const chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  chaiSubset = require('chai-subset'),
  expect = chai.expect

chai.use(chaiSubset)
chai.use(chaiAsPromised)

const Bdez = require('../bdez')

let bdez

describe('Bdez - addModel', function () {
  beforeEach(function (done) {
    const DabMemory = require("@rappopo/dab-memory"),
      dab = new DabMemory()
    bdez = new Bdez()
    bdez.addDab('test', dab)
    done()
  })

  it('should yield error if no argument passed', function (done) {
    bdez.addModel().asCallback(function (err, result) {
      expect(err).to.be.a('error').and.have.property('message', 'Requires model definition')
      done()
    })
  })

  it('should yield error if no name provided', function (done) {
    bdez.addModel({
      dabName: 'test'
    }).asCallback(function (err, result) {
      expect(err).to.be.a('error').and.have.property('message', 'Requires a name')
      done()
    })
  })

  it('should yield error if invalid schema provided', function (done) {
    bdez.addModel({
      name: 'model',
      schema: {}
    }).asCallback(function (err, result) {
      expect(err).to.be.a('error').and.have.property('message', 'Invalid schema')
      done()
    })
  })

  it('should yield error if no DAB found', function (done) {
    bdez.addModel({
      name: 'testModel',
      schema: {
        attributes: {
          name: 'text'
        }
      },
      dabName: 'none'
    }).asCallback(function (err, result) {
      expect(err).to.be.a('error').and.have.property('message', 'DAB not found')
      done()
    })
  })

  it('should return a correct model', function (done) {
    bdez.addModel({
      name: 'testModel',
      schema: {
        attributes: {
          name: 'text'
        }
      },
      dabName: 'test'
    }).asCallback(function (err, result) {
      expect(result.constructor.name).to.equal('BdezModel')
      expect(result.dabName).to.equal('test')
      expect(bdez.model).to.have.property('testModel')
      expect(bdez.model.testModel).to.equal(result)
      done()
    })
  })

})

