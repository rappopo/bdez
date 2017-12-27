'use strict'

const chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  chaiSubset = require('chai-subset'),
  expect = chai.expect

chai.use(chaiSubset)
chai.use(chaiAsPromised)

const Cls = require('../index')

describe('setOptions', function () {
  it('should only return fields with supported types', function () {
    const cls = new Cls()

    cls.setOptions({
      fields: [
        { key: 'key1', type: 'string' },
        { key: 'key2', type: 'text' },
        { key: 'key3', type: 'integer' },
        { key: 'key4', type: 'float' },
        { key: 'key5', type: 'boolean' },
        { key: 'key6', type: 'date' },
        { key: 'key7', type: 'datetime' },
        { key: 'key8', type: 'anytype1' },
        { key: 'key9', type: 'anytype2' }
      ]
    })
    expect(cls.getFields()).to.containSubset([{ key: 'key1', type: 'string' }])
    expect(cls.getFields()).to.containSubset([{ key: 'key2', type: 'text' }])
    expect(cls.getFields()).to.containSubset([{ key: 'key3', type: 'integer' }])
    expect(cls.getFields()).to.containSubset([{ key: 'key4', type: 'float' }])
    expect(cls.getFields()).to.containSubset([{ key: 'key5', type: 'boolean' }])
    expect(cls.getFields()).to.containSubset([{ key: 'key6', type: 'date' }])
    expect(cls.getFields()).to.containSubset([{ key: 'key7', type: 'datetime' }])
  })

  it('should return as is if subtype is a custom field', function () {
    const cls = new Cls({
      fields: [
        { key: 'key1', type: 'geo_point', subtype: 'custom' },
      ]
    })
    expect(cls.getFields()).to.containSubset([{ key: 'key1', type: 'geo_point' }])
  })

  it('should return length of 255 for strings that don\'t have length', function () {
    const cls = new Cls({
      fields: [
        { key: 'key1', type: 'string' },
        { key: 'key2', type: 'string', length: 10 },
      ]
    })
    expect(cls.getFields()).to.containSubset([{ key: 'key1', type: 'string', length: 255 }])
    expect(cls.getFields()).to.containSubset([{ key: 'key2', type: 'string', length: 10 }])
  })

  it('should return the correct default values if provided', function () {
    const cls = new Cls({
      fields: [
        { key: 'key1', type: 'string', default: 'default' },
        { key: 'key2', type: 'string', default: 10 },
        { key: 'key3', type: 'integer', default: 10 },
        { key: 'key4', type: 'float', default: 10.123 },
        { key: 'key5', type: 'integer', default: 10.123 },
        { key: 'key6', type: 'boolean' },
        { key: 'key7', type: 'boolean', default: true },
        { key: 'key8', type: 'boolean', default: false },
      ]
    })
    expect(cls.getFields()[0]).to.include({ key: 'key1', type: 'string', default: 'default' })
    expect(cls.getFields()[1]).to.include({ key: 'key2', type: 'string' }).and.not.have.property('default')
    expect(cls.getFields()[2]).to.include({ key: 'key3', type: 'integer', default: 10 })
    expect(cls.getFields()[3]).to.include({ key: 'key4', type: 'float', default: 10.123 })
    expect(cls.getFields()[4]).to.include({ key: 'key5', type: 'integer', default: 10 })
    expect(cls.getFields()[5]).to.include({ key: 'key6', type: 'boolean' }).and.not.have.property('default')
    expect(cls.getFields()[6]).to.include({ key: 'key7', type: 'boolean', default: true })
    expect(cls.getFields()[7]).to.include({ key: 'key8', type: 'boolean', default: false })
  })

  it('should return default order', function () {
    const cls = new Cls({
      fields: [
        { key: 'key1', type: 'string' },
        { key: 'key2', type: 'string' },
        { key: 'key3', type: 'string' }
      ]
    })
    expect(cls.getOrder()).to.eql(['key1', 'key2', 'key3'])
  })

  it('should return custom order with non existing fields removed', function () {
    const cls = new Cls({
      order: ['key4', 'key3', 'key2', 'key1'],
      fields: [
        { key: 'key1', type: 'string' },
        { key: 'key2', type: 'string' },
        { key: 'key3', type: 'string' }
      ]
    })
    expect(cls.getOrder()).to.eql(['key3', 'key2', 'key1'])
  })

  it('should return mask if provided with non existing fields removed', function () {
    const cls = new Cls({
      mask: {
        key1: 'field1',
        key2: 'field2',
        anykey: 'field3'
      },
      fields: [
        { key: 'key1', type: 'string' },
        { key: 'key2', type: 'string' },
        { key: 'key3', type: 'string' }
      ]
    })
    expect(cls.getMask()).to.eql({ key1: 'field1', key2: 'field2' })
  })




})