'use strict'

const chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  chaiSubset = require('chai-subset'),
  expect = chai.expect

chai.use(chaiSubset)
chai.use(chaiAsPromised)

const Bdez = require('../bdez')

describe('Bdez - delDab', function () {
  it('should yield error if not found', function () {
    const bdez = new Bdez(),
      DabMemory = require("@rappopo/dab-memory"),
      dab = new DabMemory()
    let result = bdez.addDab('test', dab).delDab('none')

    expect(result).to.be.a('error').and.have.property('message', 'DAB not found')
  })

  it('should delete from the list', function () {
    const bdez = new Bdez(),
      DabMemory = require("@rappopo/dab-memory"),
      dab = new DabMemory()
    let result = bdez.addDab('test', dab).delDab('test')

    expect(bdez.dab).to.not.have.property('test')
    expect(result).to.equal(bdez)
  })

  it('should also delete associate modules', function () {
    const bdez = new Bdez(),
      DabMemory = require("@rappopo/dab-memory"),
      dab = new DabMemory(),
      model = bdez.addDab('test', dab).addModel({
      name: 'testModel',
      schema: {
        fields: [
          { id: 'name', type: 'text' }
        ]
      },
      dabName: 'test'
    })
    let result = bdez.delDab('test')
    expect(bdez.dab).to.not.have.property('test')
    expect(bdez.model).to.not.have.property('testModel')
    expect(result).to.equal(bdez)
  })

})

