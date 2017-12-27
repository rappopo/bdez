'use strict'

const chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  chaiSubset = require('chai-subset'),
  expect = chai.expect

chai.use(chaiSubset)
chai.use(chaiAsPromised)

const Cls = require('../index'),
  input = {
    kstring: 'test',
    kint: 123456,
    kfloat: 123.456,
    kboolean: false,
    kany: 'John Doe'
  },
  options = {
    fields: [
      { key: '_id', type: 'string' },
      { key: 'age', type: 'integer' },
      { key: 'weight', type: 'float' },
      { key: 'female', type: 'boolean' },
      { key: 'name', type: 'string' },
    ]
  },
  maskedOptions = {
    mask: { _id: 'kstring', age: 'kint', weight: 'kfloat', female: 'kboolean', name: 'kany' },
    fields: options.fields
  }

describe('sanitizeDoc', function () {
  it('should return the sanitized body if fields are applied', function () {
    const cls = new Cls({
      fields: [
        { key: 'kstring', type: 'string' },
        { key: 'kint', type: 'integer' },
        { key: 'kfloat', type: 'float' },
        { key: 'kboolean', type: 'boolean' },
        { key: 'kany', type: 'string' },
      ]
    })
    let body = cls.sanitizeDoc({
      kstring: 123456,
      kint: 123456,
      kfloat: 123.456,
      kboolean: 'false',
      kany: 'John Doe'     
    })

    expect(body).to.have.property('kstring', '123456')
    expect(body).to.have.property('kint', 123456)
    expect(body).to.have.property('kfloat', 123.456)
    expect(body).to.have.property('kboolean', false)
    expect(body).to.have.property('kany', 'John Doe')
  })

  it('should return current body if mask is empty', function () {
    const cls = new Cls(options)
    let body = cls.sanitizeDoc(input)
    expect(body).to.have.property('kstring', 'test')
    expect(body).to.have.property('kint', 123456)
    expect(body).to.have.property('kfloat', 123.456)
    expect(body).to.have.property('kboolean', false)
    expect(body).to.have.property('kany', 'John Doe')
  })

  it('should return the correct body if fields and mask are applied', function () {
    const cls = new Cls(maskedOptions)
    let body = cls.sanitizeDoc(input)
    expect(body).to.have.property('_id', 'test')
    expect(body).to.have.property('age', 123456)
    expect(body).to.have.property('weight', 123.456)
    expect(body).to.have.property('female', false)
    expect(body).to.have.property('name', 'John Doe')
  })


})