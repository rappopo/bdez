'use strict'

const chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  chaiSubset = require('chai-subset'),
  expect = chai.expect,
  _ = require('lodash')

chai.use(chaiSubset)
chai.use(chaiAsPromised)

const Cls = require('../index'),
  body = [{
    _id: 'james-bond',
    name: 'James Bond',
    age: 35,
    code: '007'
  }, {
    _id: 'james-bauer',
    name: 'Jack Bauer',
    age: 32,
    code: 'JB'    
  }]

describe('convertDoc', function () {
  it('should return values with stripped fields if field doesn\'t exists', function () {
    const cls = new Cls({
      fields: [
        { key: '_id', type: 'string' },
        { key: 'name', type: 'text' },
        { key: 'age', type: 'integer' },
      ]
    })

    let result = cls.convertDoc(body[0])

    expect(result).to.have.property('_id', 'james-bond')
    expect(result).to.have.property('name', 'James Bond')
    expect(result).to.have.property('age', 35)
    expect(result).to.not.have.property('code')
  })


  it('should return values with custom order', function () {
    const cls = new Cls({
      order: ['age', '_id', 'name'],
      fields: [
        { key: '_id', type: 'string' },
        { key: 'name', type: 'text' },
        { key: 'age', type: 'integer' },
      ]
    })

    let result = cls.convertDoc(body[0]),
      keys = _.keys(result)

    expect(result).to.eql(_.omit(body[0], 'code'))
    expect(keys[0]).to.equal('age')
    expect(keys[1]).to.equal('_id')
    expect(keys[2]).to.equal('name')
  })

  it('should return values with custom mask', function () {
    const cls = new Cls({
      mask: { _id: 'ident', name: 'nama', age: 'usia', code: 'kode' },
      fields: [
        { key: '_id', type: 'string' },
        { key: 'name', type: 'text' },
        { key: 'age', type: 'integer' },
      ]
    })
    
    let result = cls.convertDoc(body[0])

    expect(result).to.eql({ ident: 'james-bond', 'nama': 'James Bond', usia: 35 })
  })

  it('should return values with stripped fields if field is hidden', function () {
    const cls = new Cls({
      fields: [
        { key: '_id', type: 'string' },
        { key: 'name', type: 'text', hidden: true },
        { key: 'age', type: 'integer', hidden: true },
        { key: 'code', type: 'string' },
      ]
    })
    
    let result = cls.convertDoc(body[0])

    expect(result).to.have.property('_id', 'james-bond')
    expect(result).to.not.have.property('name')
    expect(result).to.not.have.property('age')
    expect(result).to.have.property('code', '007')
  })
})