'use strict'

const chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  chaiSubset = require('chai-subset'),
  expect = chai.expect

chai.use(chaiSubset)
chai.use(chaiAsPromised)

const Bdez = require('../bdez')

describe('Bdez - addDab', function () {
  it('should yield error if arguments aren\'t provided', function () {
    const bdez = new Bdez()
    let result = bdez.addDab()

    expect(result).to.be.a('error').and.have.property('message', 'Requires a valid ID')
  })

  it('should yield error if dab provided isn\'t a valid one', function () {
    const bdez = new Bdez(),
      Dummy = class Dummy {},
      Dab = require("@rappopo/dab").Dab
    let result = bdez.addDab('test', new Dummy())
    let result1 = bdez.addDab('test1', new Dab())

    expect(result).to.be.a('error').and.have.property('message', 'Invalid DAB instance')
    expect(result1).to.be.a('error').and.have.property('message', 'Invalid DAB instance')
  })

  it('should properly add a DAB', function () {
    const bdez = new Bdez(),
      DabMemory = require("@rappopo/dab-memory"),
      dab = new DabMemory()
    let result = bdez.addDab('test', dab)

    expect(result).to.equal(bdez)
    expect(bdez.dab).to.have.property('test', dab)
  })


})