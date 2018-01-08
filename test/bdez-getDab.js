'use strict'

const chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  chaiSubset = require('chai-subset'),
  expect = chai.expect

chai.use(chaiSubset)
chai.use(chaiAsPromised)

const Bdez = require('../bdez')

describe('Bdez - getDab', function () {
  it('should yield error if not found', function () {
    const bdez = new Bdez(),
      DabMemory = require("@rappopo/dab-memory"),
      dab = new DabMemory()
    bdez.addDab('test', dab)
    let result = bdez.getDab('none')

    expect(result).to.be.a('error').and.have.property('message', 'DAB not found')
  })

  it('should return corresponding dab', function (done) {
    const bdez = new Bdez(),
      DabMemory = require("@rappopo/dab-memory"),
      dab1 = new DabMemory(),
      dab2 = new DabMemory()

    dab1.createCollection({ name: 'test'})
      .then(r => {
        return dab1.create({ name: 'James Bond' }, 'test')
      })
      .then(r => {
        bdez.addDab('test1', dab1)
        bdez.addDab('test2', dab2)
        let result = bdez.getDab('test1')

        expect(result).to.be.instanceof(DabMemory)
        expect(result.data).to.have.property('test').that.have.length(1)
        expect(result.data.test[0]).to.have.property('name', 'James Bond')
        done()
      })

  })

})

