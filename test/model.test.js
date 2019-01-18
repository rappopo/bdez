const Model = require('../index').Model
const _ = require('lodash')
const DabMemory = require('@rappopo/dab-memory')

const dab = new DabMemory()
dab.name = 'test'
const model = new Model()

describe('Model', () => {
  describe('normalizeSchema', () => {
    test('Should throw an error if it doesn\'t have a name', () => {
      expect(() => {
        model.normalizeSchema()
      }).toThrowWithMessage(Error, 'Requires a name')
    })
    test('Should throw an error if it doesn\'t have attributes', () => {
      expect(() => {
        model.normalizeSchema({ name: 'one' })
      }).toThrowWithMessage(Error, 'Require attributes')
    })
    test('Should return default schema', () => {
      const schema = model.normalizeSchema({
        name: 'one',
        attributes: { name: 'string' }
      })
      expect(schema)
        .toBeObject()
        .toContainEntry(['name', 'one'])
        .toContainEntry(['attributes', { name: 'string' }])
        .toContainEntry(['indexes', {}])
        .toContainEntry(['hook', {}])
        .toContainEntry(['behavior', {}])
    })
    test('Should change attributes and indexes if behaviors are given', () => {
      const schema = model.normalizeSchema({
        name: 'one',
        attributes: { name: 'string', created_at: 'string' },
        behavior: {
          createdAt: true,
          updatedAt: true
        }
      })
      expect(schema.behavior)
        .toContainEntry(['createdAt', 'created_at'])
        .toContainEntry(['updatedAt', 'updated_at'])
      expect(schema.attributes)
        .toContainEntry(['created_at', 'datetime'])
        .toContainEntry(['updated_at', 'datetime'])
      expect(schema.indexes)
        .toContainEntry(['created_at', true])
        .toContainEntry(['updated_at', true])
    })
    test('Should change attributes and indexes for behavior with custom column names too', () => {
      const schema = model.normalizeSchema({
        name: 'one',
        attributes: { name: 'string' },
        behavior: {
          createdAt: 'inserted',
          updatedAt: 'edited'
        }
      })
      expect(schema.behavior)
        .toContainEntry(['createdAt', 'inserted'])
        .toContainEntry(['updatedAt', 'edited'])
      expect(schema.attributes)
        .toContainEntry(['inserted', 'datetime'])
        .toContainEntry(['edited', 'datetime'])
      expect(schema.indexes)
        .toContainEntry(['inserted', true])
        .toContainEntry(['edited', true])
    })
  })
})
