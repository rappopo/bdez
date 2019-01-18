const BDez = require('../index').BDez
const _ = require('lodash')
const DabMemory = require('@rappopo/dab-memory')

let bdez

beforeAll(() => {
  bdez = new BDez()
})

describe('BDez', () => {
  describe('addDab', () => {
    test('Should return promise rejection if it doesn\'t have a name', async () => {
      await bdez.addDab().catch(err => {
        expect(err)
          .toBeInstanceOf(Error)
          .toContainEntry(['message', 'Requires a name'])
      })
    })

    test('Should correctly add a dab', async () => {
      const dab1 = new DabMemory()
      await bdez.addDab('one', dab1).then(result => {
        expect(bdez.dabs).toHaveProperty('one')
        expect(bdez.dabs.one).toBeInstanceOf(DabMemory)
      })
    })

    test('Should return promise rejection if a name has been used already', async () => {
      const dab2 = new DabMemory()
      await bdez.addDab('one', dab2).catch(err => {
        expect(err)
          .toBeInstanceOf(Error)
          .toContainEntry(['message', 'An instance with the same name exists already'])
      })
    })

    test('Should return promise rejection if \'dab\' not a valid DAB instance', async () => {
      const dab2 = bdez
      await bdez.addDab('two', dab2).catch(err => {
        expect(err)
          .toBeInstanceOf(Error)
          .toContainEntry(['message', 'Invalid DAB instance'])
      })
    })

    test('Should correctly create a dab and add it from dab config', async () => {
      const dab2 = { dab: '@rappopo/dab-memory' }
      await bdez.addDab('two', dab2).then(result => {
        expect(bdez.dabs)
          .toBeObject()
          .toContainKey('two')
        expect(bdez.dabs.two).toBeInstanceOf(DabMemory)
        expect(result).toBeInstanceOf(DabMemory)
      })
    })
  })

  describe('getDab', () => {
    test('Should throw error if not found', () => {
      expect(() => {
        bdez.getDab()
      }).toThrowWithMessage(Error, 'DAB not found')
      expect(() => {
        bdez.getDab('nonexistent')
      }).toThrowWithMessage(Error, 'DAB not found')
    })

    test('Should return the correct dab', () => {
      expect(bdez.getDab('one')).toBeInstanceOf(DabMemory)
    })
  })

  describe('deleteDab', () => {
    test('Should return promise rejection if not found', async () => {
      await bdez.deleteDab('nonexistent').catch(err => {
        expect(err)
          .toBeInstanceOf(Error)
          .toContainEntry(['message', 'DAB not found'])
      })
    })

    test('Should correctly remove dab and destroy all models attached to it', async () => {
      await bdez.deleteDab('one')
      expect(bdez.dabs).not.toContainKey('one')
      const models = []
      _.forOwn(bdez.models, m => {
        if (m.dabName === 'one') models.push(m)
      })
      expect(models)
        .toBeArray()
        .toHaveLength(0)
    })
  })
})
