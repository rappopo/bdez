'use strict'

const chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  chaiSubset = require('chai-subset'),
  expect = chai.expect

chai.use(chaiSubset)
chai.use(chaiAsPromised)

const Bdez = require('../bdez')

let bdez, model

describe('Bdez - delModel', function () {
  beforeEach(function (done) {
    const DabMemory = require("@rappopo/dab-memory"),
      dab = new DabMemory()
    bdez = new Bdez()
    bdez.addDab('test', dab).addModel({
      name: 'testModel',
      schema: {
        fields: [
          { id: 'name', type: 'text' }
        ]
      },
      dabName: 'test'
    }).asCallback(function (err, result) {
      model = result
      done()
    })
  })

  it('should yield error if not found', function () {
    let result = bdez.delModel('none')

    expect(result).to.be.a('error').and.have.property('message', 'Model not found')
  })

  it('should delete from the list', function () {
    let result = bdez.delModel('testModel')

    expect(bdez.model).to.not.have.property('testModel')
    expect(result).to.equal(bdez)
  })

})

