'use strict'

const _ = require('lodash'),
  Collection = require('@rappopo/dab').Collection

class BdezModel {
  constructor (bdez) {
    this.dabName = null
    this.bdez = bdez
    this.name = null
    this.hook = {}
  }

  init (options) {
    options = options || {}
    options.schema = options.schema || {}
    options.hook = options.hook || {}
    return new Promise((resolve, reject) => {
      if (_.isEmpty(options.name))
        return reject(new Error('Requires a name'))
      if (_.isEmpty(options.schema.fields))
        return reject(new Error('Invalid schema'))
      let dab = this.bdez.dab[options.dabName]
      if (!dab) 
        return reject(new Error('DAB not found'))

      dab.createCollection(_.merge(options.schema, { name: options.name }))
        .then(result => {
          this.dabName = options.dabName
          this.name = options.name
          _.each(['beforeCreate', 'afterCreate', 'beforeUpdate', 'afterUpdate', 'beforeRemove', 'afterRemove', 
            'beforeBulkCreate', 'afterBulkCreate', 'beforeBulkUpdate', 'afterBulkUpdate',
            'beforeBulkRemove', 'afterBulkRemove', 'beforeValidate', 'afterValidate'], m => {
            const dummyFn = function (...args) {
              return Promise.resolve()
            }
            this.hook[m] = typeof options.hook[m] === 'function' ? options.hook[m] : dummyFn
          })
          resolve(this)
        })
        .catch(reject)
    })
  }

  getDab () {
    let dab = this.bdez.dab[this.dabName]
    if (!dab) return new Error('DAB not found')
    return dab
  }

  getDabCollection () {
    let dab = this.getDab()
    if (dab instanceof Error) 
      return dab
    let collection = dab.collection[this.name]
    if (!collection)
      return new Error('Collection not found')
    return collection
  }

  sanitize (params, body) {
    [params, body] = this.getDab().sanitize(params, body)

    params = _.merge(params || {}, { collection: this.name })
    return [params, body]
  }

  find (oparams) {
    let dab = this.getDab()
    if (dab instanceof Error)
      return Promise.reject(dab)

    let [params] = this.sanitize(oparams)
    return dab.find(params)
  }

  findOne (id, oparams) {
    let dab = this.getDab()
    if (dab instanceof Error)
      return Promise.reject(dab)

    let [params] = this.sanitize(oparams)
    return dab.findOne(id, params)
  }

  create (obody, oparams) {
    let dab = this.getDab()
    if (dab instanceof Error)
      return Promise.reject(dab)
    let [params, body] = this.sanitize(oparams, obody)

    return new Promise((resolve, reject) => {
      let _result = null, _errBefore = null, _errBeforeValidate = null,
        _errValidate = null, _errAfterValidate = null
      this.hook.beforeValidate(body, params).asCallback((err, result) => {
        if (err && !params.ignoreError)
          return reject(err)
        if (err)
          _errBeforeValidate = err
        let e = dab.validateDoc(body, params)
        if (!_.isEmpty(e) && !params.ignoreError)
          return reject(e)
        if (!_.isEmpty(e))
          _errValidate = e
        this.hook.afterValidate(body, params).asCallback((err, result) => {
          if (err && !params.ignoreError)
            return reject(err)
          if (err)
            _errAfterValidate = err
          this.hook.beforeCreate(body, params).asCallback((err, result) => {
            if (err && !params.ignoreError)
              return reject(err)
            let newBody = _.isPlainObject(result) ? (result.body || body) : body
            if (err) {
              _errBefore = err
              newBody = body
            }
            dab.create(newBody, params).asCallback((err, result) => {
              if (err)
                return reject(err)
              if (_errBeforeValidate)
                result.beforeValidateError = _errBeforeValidate
              if (_errValidate)
                result.validateError = _errValidate
              if (_errAfterValidate)
                result.afterValidateError = _errAfterValidate
              if (_errBefore)
                result.beforeCreateError = _errBefore
              _result = _.cloneDeep(result)
              this.hook.afterCreate(body, _result, params).asCallback((err, result) => {
                if (err && !params.ignoreError)
                  return reject(err)
                let newResult = _.isPlainObject(result) ? (result.result || _result) : _result
                if (err)
                  newResult.afterCreateError = err
                resolve(newResult)
              })
            })
          })
        })
      })
    })
  }

  update (id, obody, oparams) {
    let dab = this.getDab()
    if (dab instanceof Error)
      return Promise.reject(dab)

    let [params, body] = this.sanitize(oparams, obody)
    if (!_.has(params, 'ignoreColumn'))
      params.ignoreColumn = []
    params.ignoreColumn.push(this.getDabCollection().attribId)

    _.each(this.getDabCollection().fields, f => {
      if (!_.has(body, f.id))
        params.ignoreColumn.push(f.id)
    })
    params.ignoreColumn = _.uniq(params.ignoreColumn)

    return new Promise((resolve, reject) => {
      let _result = null, _errBefore = null, _errBeforeValidate = null,
        _errValidate = null, _errAfterValidate = null
      this.hook.beforeValidate(body, params).asCallback((err, result) => {
        if (err && !params.ignoreError)
          return reject(err)
        if (err)
          _errBeforeValidate = err
        let e = dab.validateDoc(body, params)
        if (!_.isEmpty(e) && !params.ignoreError)
          return reject(e)
        if (!_.isEmpty(e))
          _errValidate = e
        this.hook.afterValidate(body, params).asCallback((err, result) => {
          if (err && !params.ignoreError)
            return reject(err)
          if (err)
            _errAfterValidate = err
          this.hook.beforeUpdate(id, body, params).asCallback((err, result) => {
            if (err && !params.ignoreError)
              return reject(err)
            let newBody = _.isPlainObject(result) ? (result.body || body) : body
            if (err) {
              _errBefore = err
              newBody = body
            }
            dab.update(id, newBody, params).asCallback((err, result) => {
              if (err)
                return reject(err)
              if (_errBeforeValidate)
                result.beforeValidateError = _errBeforeValidate
              if (_errValidate)
                result.validateError = _errValidate
              if (_errAfterValidate)
                result.afterValidateError = _errAfterValidate
              if (_errBefore)
                result.beforeUpdateError = _errBefore
              _result = _.cloneDeep(result)
              this.hook.afterUpdate(id, body, _result, params).asCallback((err, result) => {
                if (err && !params.ignoreError)
                  return reject(err)
                let newResult = _.isPlainObject(result) ? (result.result || _result) : _result
                if (err)
                  newResult.afterUpdateError = err
                resolve(newResult)
              })
            })
          })
        })
      })
    })
  }

  remove (id, oparams) {
    let dab = this.getDab()
    if (dab instanceof Error)
      return Promise.reject(dab)

    let [params, body] = this.sanitize(oparams)
    return new Promise((resolve, reject) => {
      let _result = null, _errBefore = null
      this.hook.beforeRemove(id, params).asCallback((err, result) => {
        if (err && !params.ignoreError)
          return reject(err)
        let newId = _.isPlainObject(result) ? (result.id || id) : id
        if (err) {
          _errBefore = err
          newId = id
        }
        dab.remove(newId, params).asCallback((err, result) => {
          if (err)
            return reject(err)
          if (_errBefore)
            result.beforeRemoveError = _errBefore
          _result = _.cloneDeep(result)
          this.hook.afterRemove(id, _result, params).asCallback((err, result) => {
            if (err && !params.ignoreError)
              return reject(err)
            let newResult = _.isPlainObject(result) ? (result.result || _result) : _result
            if (err)
              newResult.afterRemoveError = err
            resolve(newResult)
          })
        })
      })
    })

  }

  bulkCreate (obody, oparams) {
    let dab = this.getDab()
    if (dab instanceof Error)
      return Promise.reject(dab)

    let [params, body] = this.sanitize(oparams, obody)
    return new Promise((resolve, reject) => {
      let _result = null, _errBefore = null
      this.hook.beforeBulkCreate(body, params).asCallback((err, result) => {
        if (err && !params.ignoreError)
          return reject(err)
        let newBody = _.isPlainObject(result) ? (result.body || body) : body
        if (err) {
          _errBefore = err
          newBody = body
        }
        dab.bulkCreate(newBody, params).asCallback((err, result) => {
          if (err)
            return reject(err)
          if (_errBefore)
            result.beforeBulkCreateError = _errBefore
          _result = _.cloneDeep(result)
          this.hook.afterBulkCreate(body, _result, params).asCallback((err, result) => {
            if (err && !params.ignoreError)
              return reject(err)
            let newResult = _.isPlainObject(result) ? (result.result || _result) : _result
            if (err)
              newResult.afterBulkCreateError = err
            resolve(newResult)
          })
        })
      })
    })
  }

  bulkUpdate (obody, oparams) {
    let dab = this.getDab()
    if (dab instanceof Error)
      return Promise.reject(dab)

    let [params, body] = this.sanitize(oparams, obody)
    return new Promise((resolve, reject) => {
      let _result = null, _errBefore = null
      this.hook.beforeBulkUpdate(body, params).asCallback((err, result) => {
        if (err && !params.ignoreError)
          return reject(err)
        let newBody = _.isPlainObject(result) ? (result.body || body) : body
        if (err) {
          _errBefore = err
          newBody = body
        }
        dab.bulkUpdate(newBody, params).asCallback((err, result) => {
          if (err)
            return reject(err)
          if (_errBefore)
            result.beforeBulkUpdateError = _errBefore
          _result = _.cloneDeep(result)
          this.hook.afterBulkUpdate(body, _result, params).asCallback((err, result) => {
            if (err && !params.ignoreError)
              return reject(err)
            let newResult = _.isPlainObject(result) ? (result.result || _result) : _result
            if (err)
              newResult.afterBulkUpdateError = err
            resolve(newResult)
          })
        })
      })
    })
  }

  bulkRemove (obody, oparams) {
    let dab = this.getDab()
    if (dab instanceof Error)
      return Promise.reject(dab)

    let [params, body] = this.sanitize(oparams, obody)
    return new Promise((resolve, reject) => {
      let _result = null, _errBefore = null
      this.hook.beforeBulkRemove(body, params).asCallback((err, result) => {
        if (err && !params.ignoreError)
          return reject(err)
        let newBody = _.isPlainObject(result) ? (result.body || body) : body
        if (err) {
          _errBefore = err
          newBody = body
        }
        dab.bulkRemove(newBody, params).asCallback((err, result) => {
          if (err)
            return reject(err)
          if (_errBefore)
            result.beforeBulkRemoveError = _errBefore
          _result = _.cloneDeep(result)
          this.hook.afterBulkRemove(body, _result, params).asCallback((err, result) => {
            if (err && !params.ignoreError)
              return reject(err)
            let newResult = _.isPlainObject(result) ? (result.result || _result) : _result
            if (err)
              newResult.afterBulkRemoveError = err
            resolve(newResult)
          })
        })
      })
    })
  }

  copyFrom (src, params) {
    let dab = this.getDab()
    if (dab instanceof Error)
      return Promise.reject(dab)

    [params] = this.sanitize(params)
    return dab.copyFrom(src, params)    
  }

  copyTo (dest, params) {
    let dab = this.getDab()
    if (dab instanceof Error)
      return Promise.reject(dab)

    [params] = this.sanitize(params)
    return dab.copyTo(dest, params)    
  }

}

module.exports = BdezModel