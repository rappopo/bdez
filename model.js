'use strict'

const _ = require('lodash')
const hookTypes = ['beforeCreate', 'afterCreate', 'beforeUpdate', 'afterUpdate', 'beforeRemove',
  'afterRemove', 'beforeBulkCreate', 'afterBulkCreate', 'beforeBulkUpdate', 'afterBulkUpdate',
  'beforeBulkRemove', 'afterBulkRemove', 'beforeValidate', 'afterValidate']
const schemaKeys = ['name', 'attributes', 'indexes', 'order', 'srcAttribId', 'srcAttribIdType',
  'srcAttribName']

class Model {
  constructor () {
    this.dab = null
    this.name = ''
    this.hook = []
    this.behavior = {}
  }

  normalizeSchema (schema) {
    schema = schema || {}
    schema.attributes = schema.attributes || {}
    schema.indexes = schema.indexes || {}
    schema.hook = schema.hook || []
    schema.behavior = schema.behavior || {}
    // behavior
    _.each(['createdAt', 'updatedAt'], item => {
      const col = _.snakeCase(item)
      if (schema.behavior[item] === true) {
        schema.attributes[col] = 'datetime'
        schema.behavior[item] = col
        schema.indexes[col] = true
      } else if (_.isString(schema.behavior[item])) {
        schema.attributes[schema.behavior[item]] = 'datetime'
        schema.indexes[schema.behavior[item]] = true
      }
    })
    if (!schema.name) throw new Error('Requires a name')
    if (_.isEmpty(schema.attributes)) throw new Error('Require attributes')
    return schema
  }

  init (dab, schema, opts) {
    return new Promise((resolve, reject) => {
      schema = this.normalizeSchema(schema)
      this.dab = dab
      this.dabName = dab.name
      this.name = schema.name

      return new Promise((resolve, reject) => {
        this.dab.createCollection(_.pick(schema, schemaKeys), opts).then(result => {
          // save things that dab doesn't support
          _.each(hookTypes, m => {
            const dummyFn = function (...args) {
              return Promise.resolve()
            }
            const handler = typeof schema.hook[m] === 'function' ? schema.hook[m] : dummyFn
            this.addHook(m, 'default', handler, 1)
          })
          this.behavior = schema.behavior
          resolve(this)
        }).catch(reject)
      })
    })
  }

  // hooks

  addHook (type, name = 'default', handler, priority = 1, override = false) {
    if (!_.isFunction(handler)) throw new Error('Requires a function handler')
    if (hookTypes.indexOf(type) === -1) throw new Error('Invalid type')
    const existing = _.findIndex(this.hook, { name: name, type: type })
    if (existing > -1 && !override) throw new Error('Hook with such name and type already exists')
    if (existing) this.hook[existing] = { name: name, type: type, handler: handler, priority: priority }
    return this
  }

  getHook (type, name = 'default') {
    const hook = _.find(this.hook, { type: type, name: name })
    if (!hook) throw new Error('No such hook found')
    return hook
  }

  getHooksByType (type) {
    return _(this.hooks).filter({ type: type }).orderBy(['priority'], ['desc']).values()
  }

  getAllHooks () {
    return this.hook
  }

  deleteHook (type, name = 'default') {
    const existing = _.findIndex(this.hook, { type: type, name: name })
    if (existing === -1) throw new Error('No such hook found')
    this.hook.splice(existing, 1)
    return this
  }

  clearHook () {
    this.hook.length = 0
    return this
  }

  // behavior

  getAllBehavior () {
    return this.behavior
  }

  destroy (opts) {
    return new Promise((resolve, reject) => {
      this.dab.removeCollection(this.name, opts).then(result => {
        this.hook = []
        this.name = null
        this.dab = null
        this.behavior = null
        resolve(true)
      }).catch(reject)
    })
  }

  getSchema () {
    return _.pick(this.dab.collection[this.name], schemaKeys)
  }

  getAttributes () {
    return this.getSchema().attributes
  }

  getIndexes () {
    return this.getSchema().indexes
  }

  getIdColumn (collection) {
    return this.getSchema().srcAttribId
  }
}

module.exports = Model
