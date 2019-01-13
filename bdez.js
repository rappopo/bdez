'use strict'

const Promise = require('bluebird')
const _ = require('lodash')
const Dab = require('@rappopo/dab').Dab
const Model = require('./model')

class BDez {
  constructor (options) {
    options = options || {}
    this.dabs = {}
    this.models = {}
  }

  addDab (name, dab) {
    return new Promise((resolve, reject) => {
      if (_.isEmpty(name)) throw new Error('Requires a name')
      if (_.has(this.dab, name)) throw new Error('An instance with the same name exists already')
      let dabInstance
      if (dab instanceof Dab) {
        if (dab.constructor.name === 'Dab') throw new Error('Invalid DAB instance')
        dabInstance = dab
      } else {
        dabInstance = new (require(dab.dab))(dab.options)
      }
      dabInstance.name = name
      this.dabs[name] = dabInstance
      resolve(this)
    })
  }

  getDab (name) {
    if (!_.has(this.dabs, name)) return new Error('DAB not found')
    return this.dabs[name]
  }

  deleteDab (name, params) {
    return new Promise((resolve, reject) => {
      if (!_.has(this.dabs, name)) throw new Error('DAB not found')
      const deleted = []
      _.forOwn(this.models, (v, k) => {
        if (v.dab.name === name) deleted.push(v.destroy(params))
      })
      Promise.all(deleted).then(result => {
        delete this.dab[name]
        resolve(this)
      }).catch(reject)
    })
  }

  addModel (name, dabName, schema, params) {
    return new Promise((resolve, reject) => {
      const dab = this.getDab(dabName)
      const model = new Model()
      model.init(dab, schema, params).then(model => {
        this.models[name] = model
        resolve(this)
      }).catch(reject)
    })
  }

  getModel (name) {
    if (!_.has(this.models, name)) return new Error('Model not found')
    return this.models[name]
  }

  deleteModel (name, params) {
    return new Promise((resolve, reject) => {
      if (!_.has(this.models, name)) throw new Error('Model not found')
      this.models[name].destroy(params).then(result => {
        delete this.models[name]
        resolve(this)
      }).catch(reject)
    })
  }

  _findForUnique (collection, body, index, existing = {}, limit = 2) { // set for more than 1
    return new Promise((resolve, reject) => {
      let query = {}
      _.each(index.column, c => {
        if (!_.has(body, c)) return
        query[c] = body[c]
      })
      if (_.isEmpty(query)) return resolve(0)
      const deleted = []
      _.forOwn(query, (v, k) => {
        if (_.has(existing, k) && existing[k] === v) deleted.push(k)
      })
      query = _.omit(query, deleted)
      if (_.isEmpty(query)) return resolve(0)
      const model = this.getModel(collection)
      model.dab.find({ query: query, limit: limit, collection: collection }).then(result => {
        resolve(result.data.length)
      }).catch(e => {
        resolve(-1)
      })
    })
  }

  // CRUD methods

  find (collection, opts) {
    const options = _.merge(_.cloneDeep(opts), { collection: collection })
    return new Promise((resolve, reject) => {
      const model = this.getModel(collection)
      model.dab.find(options).then(resolve).catch(reject)
    })
  }

  findOne (collection, id, opts) {
    const options = _.merge(_.cloneDeep(opts), { collection: collection })
    return new Promise((resolve, reject) => {
      const model = this.getModel(collection)
      model.dab.findOne(id, options).then(resolve).catch(reject)
    })
  }

  create (collection, body, opts) {
    const skips = ['skipHook', 'skipValidation']
    const options = _.merge(_.omit(opts, skips), { collection: collection })
    const optionsSkips = _.pick(opts, skips)

    return new Promise((resolve, reject) => {
      const model = this.getModel(collection)
      let finalResult
      let uniques = []
      let uniquesName = []
      _.forOwn(model.getIndexes(), (idx, idxName) => {
        if (!idx.unique) return
        uniques.push(idx)
        uniquesName.push(idxName)
      })

      Promise.resolve().then(result => {
        if (_.get(optionsSkips, 'skipHook.all') || _.get(optionsSkips, 'skipHook.beforeValidate')) return true
        const hooks = model.getHooksByType('beforeValidate')
        if (hooks.length === 0) return true
        return Promise.reduce(hooks, (newBody, hook) => {
          return hook.handler(newBody, options).then(result => {
            return result.body ? result.body : newBody
          })
        }, body)
      }).then(result => {
        if (_.isPlainObject(result)) body = result
        if (optionsSkips.skipValidation) return true
        const e = model.dab.validateDoc(body, options)
        if (e) throw e
        return Promise.map(uniques, u => {
          return this._findForUniq(collection, body, u)
        })
      }).then(result => {
        if (result.length > 0) {
          let err = {}
          _.each(result, (r, i) => {
            if (r !== 0) err[uniques[i].column.join(',')] = ['uniqueContraint']
          })
          if (!_.isEmpty(err)) {
            const e = new Error('Validation error')
            e.details = err
            throw e
          }
        }
        if (_.get(optionsSkips, 'skipHook.all') || _.get(optionsSkips, 'skipHook.afterValidate')) return true
        const hooks = model.getHooksByType('afterValidate')
        if (hooks.length === 0) return true
        return Promise.reduce(hooks, (newBody, hook) => {
          return hook.handler(newBody, options).then(result => {
            return result.body ? result.body : newBody
          })
        }, body)
      }).then(result => {
        if (_.isPlainObject(result)) body = result
        if (_.get(optionsSkips, 'skipHook.all') || _.get(optionsSkips, 'skipHook.beforeCreate')) return true
        const hooks = model.getHooksByType('beforeCreate')
        if (hooks.length === 0) return true
        return Promise.reduce(hooks, (newBody, hook) => {
          return hook.handler(newBody, options).then(result => {
            return result.body ? result.body : newBody
          })
        }, body)
      }).then(result => {
        if (_.isPlainObject(result)) body = result
        _.forOwn(model.getAllBehavior(), (v, k) => {
          if (['createdAt', 'updatedAt'].indexOf(k) > -1) body[v] = new Date()
        })
        return model.dab.create(body, options)
      }).then(result => {
        finalResult = result
        if (_.get(optionsSkips, 'skipHook.all') || _.get(optionsSkips, 'skipHook.afterCreate')) return true
        const hooks = model.getHooksByType('afterCreate')
        if (hooks.length === 0) return true
        return Promise.reduce(hooks, (newResult, hook) => {
          return hook.handler(body, newResult, options).then(result => {
            return result.result ? result.result : newResult
          })
        }, result.data)
      }).then(result => {
        if (_.isPlainObject(result)) finalResult.data = result
        resolve(finalResult)
      }).catch(reject)
    })
  }

  update (collection, id, body = {}, opts) {
    const skips = ['skipHook', 'skipValidation']
    const options = _.merge(_.omit(opts, skips), { collection: collection })
    const optionsSkips = _.pick(opts, skips)

    return new Promise((resolve, reject) => {
      const model = this.getModel(collection)
      let finalResult
      let uniques = []
      let uniquesName = []
      let excludeUpdate = _.get(model.getSchema(), 'exclude.update', [])
      body = _.omit(body, excludeUpdate)
      _.forOwn(model.getIndexes(), (idx, idxName) => {
        if (!idx.unique) return
        const isec = _.intersection(_.keys(body), idx.column)
        if (!_.isEqual(isec.sort(), idx.column.sort())) return
        uniques.push(idx)
        uniquesName.push(idxName)
      })

      Promise.resolve().then(result => {
        if (_.get(optionsSkips, 'skipHook.all') || _.get(optionsSkips, 'skipHook.beforeValidate')) return true
        const hooks = model.getHooksByType('beforeValidate')
        if (hooks.length === 0) return true
        return Promise.reduce(hooks, (newBody, hook) => {
          return hook.handler(id, newBody, options).then(result => {
            return result.body ? result.body : newBody
          })
        }, body)
      }).then(result => {
        if (_.isPlainObject(result)) body = _.omit(result, excludeUpdate)
        return model.dab.findOne(id, options)
      }).then(result => {
        if (optionsSkips.skipValidation) return true
        let keys = _.keys(model.getAttributes())
        let bodyKeys = _.keys(body)
        let ignoreColumn = _.without(keys, ...bodyKeys)
        const e = model.dab.validateDoc(body, _.merge(_.cloneDeep(options), { ignoreColumn: ignoreColumn }))
        if (e) throw e
        return Promise.map(uniques, u => {
          return this._findForUniq(collection, body, u, result.data)
        })
      }).then(result => {
        if (result.length > 0) {
          let err = {}
          _.each(result, (r, i) => {
            if (r !== 0) err[uniques[i].column.join(',')] = ['uniqueContraint']
          })
          if (!_.isEmpty(err)) {
            const e = new Error('Validation error')
            e.details = err
            throw e
          }
        }
        if (_.get(optionsSkips, 'skipHook.all') || _.get(optionsSkips, 'skipHook.afterValidate')) return true
        const hooks = model.getHooksByType('afterValidate')
        if (hooks.length === 0) return true
        return Promise.reduce(hooks, (newBody, hook) => {
          return hook.handler(id, newBody, options).then(result => {
            return result.body ? result.body : newBody
          })
        }, body)
      }).then(result => {
        if (_.isPlainObject(result)) body = _.omit(result, excludeUpdate)
        if (_.get(optionsSkips, 'skipHook.all') || _.get(optionsSkips, 'skipHook.beforeUpdate')) return true
        const hooks = model.getHooksByType('beforeUpdate')
        if (hooks.length === 0) return true
        return Promise.reduce(hooks, (newBody, hook) => {
          return hook.handler(id, newBody, options).then(result => {
            return result.body ? result.body : newBody
          })
        }, body)
      }).then(result => {
        let excludeFullReplace = _.get(model.getSchema(), 'exclude.fullReplace', [])
        if (_.isPlainObject(result)) body = _.omit(result, excludeUpdate)
        _.forOwn(model.getAllBehavior(), (v, k) => {
          if (['updatedAt'].indexOf(k) > -1) {
            body[v] = new Date()
            excludeFullReplace.push(v)
          }
          if (['createdAt'].indexOf(k) > -1) {
            excludeFullReplace.push(v)
          }
        })
        excludeFullReplace = _.uniq(excludeFullReplace)
        return model.dab.update(id, body, _.merge(_.cloneDeep(options), { fullReplaceExclude: excludeFullReplace }))
      }).then(result => {
        finalResult = result
        if (_.get(optionsSkips, 'skipHook.all') || _.get(optionsSkips, 'skipHook.afterUpdate')) return true
        const hooks = model.getHooksByType('afterUpdate')
        if (hooks.length === 0) return true
        return Promise.reduce(hooks, (newResult, hook) => {
          return hook.handler(id, body, newResult, options).then(result => {
            return result.result ? result.result : newResult
          })
        }, result.data)
      }).then(result => {
        if (_.isPlainObject(result)) finalResult.data = result
        resolve(finalResult)
      }).catch(reject)
    })
  }

  remove (collection, id, opts) {
    const skips = ['skipHook', 'skipValidation']
    const options = _.merge(_.omit(opts, skips), { collection: collection })
    const optionsSkips = _.pick(opts, skips)

    return new Promise((resolve, reject) => {
      const model = this.getModel(collection)
      let finalResult
      Promise.resolve().then(result => {
        if (_.get(optionsSkips, 'skipHook.all') || _.get(optionsSkips, 'skipHook.beforeRemove')) return true
        const hooks = model.getHooksByType('beforeRemove')
        if (hooks.length === 0) return true
        return Promise.reduce(hooks, (newId, hook) => {
          return hook.handler(newId, options).then(result => {
            return result.id ? result.id : newId
          })
        }, id)
      }).then(result => {
        return model.dab.remove(id, options)
      }).then(result => {
        finalResult = result
        if (_.get(optionsSkips, 'skipHook.all') || _.get(optionsSkips, 'skipHook.afterRemove')) return true
        const hooks = model.getHooksByType('afterRemove')
        if (hooks.length === 0) return true
        return Promise.reduce(hooks, (newResult, hook) => {
          return hook.handler(id, newResult, options).then(result => {
            return result.result ? result.result : newResult
          })
        }, result.data)
      }).then(result => {
        if (_.isPlainObject(result)) finalResult.data = result
        resolve(finalResult)
      }).catch(reject)
    })
  }
}

module.exports = BDez
