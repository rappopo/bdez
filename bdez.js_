'use strict'

const _ = require('lodash'),
  Model = require('./model'),
  Dab = require('@rappopo/dab').Dab

class BDez {
  constructor (options) {
    options = options || {}
    this.dab = {}
    this.model = {}
  }

  addDab (id, dab) {
    if (_.isEmpty(id))
      return new Error('Requires a valid ID')
    if (!(dab instanceof Dab)|| ((dab instanceof Dab) && dab.constructor.name === 'Dab'))
      return new Error('Invalid DAB instance')
    this.dab[id] = dab
    return this
  }

  getDab (id) {
    if (!_.has(this.dab, id))
      return new Error('DAB not found')
    return this.dab[id]
  }

  delDab (id) {
    if (!_.has(this.dab, id))
      return new Error('DAB not found')
    _.forOwn(this.model, (v, k) => {
      if (v.dabName === id)
        delete this.model[k]
    })
    delete this.dab[id]
    return this
  }

  addModel (modelDef) {
    modelDef = modelDef || {}
    return new Promise((resolve, reject) => {
      if (_.isEmpty(modelDef))
        return reject(new Error('Requires model definition'))
      if (_.has(this.model, modelDef.name))
        return reject(new Error('Model already exists'))
      const model = new Model(this)
      model.init(modelDef)
        .then(result => {
          this.model[modelDef.name] = result
          resolve(result)
        })
        .catch(reject)
    })
  }

  getModel (name) {
    if (!_.has(this.model, name))
      return new Error('Model not found')
    return this.model[name]
  }

  delModel (name) {
    if (!_.has(this.model, name))
      return new Error('Model not found')
    delete this.model[name]
    return this
  }

  deleteDab (id) {
    return this.delDab(id)
  }

  deleteModel (name) {
    return this.delModel(name)
  }

}

module.exports = BDez