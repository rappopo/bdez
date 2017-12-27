'use strict'

const _ = require('lodash')

const boolTrue = ['true', 'yes', '1'],
  boolFalse = ['false', 'no', '0']

class BDez {
  constructor (options) {
    options = options || {}
    this.fields = []
    this.mask = {}
    this.order = []
    this.setOptions(options)
  }

  /**
  * Helper
  */

  convertDoc (rec, params) {
    let newRec = {}
    _.each(this.order, o => {
      let field = _.find(this.fields, { key: o })
      if (field && !field.hidden) 
        newRec[this.mask[o] || o] = rec[o] || null
    })
    return newRec
  }

  sanitizeDoc (body, params) {
    params = params || {}
    let newBody = _.cloneDeep(body)
    // converted
    if (!_.isEmpty(this.mask)) {
      let keys = _.map(this.fields, 'key')
      _.each(keys, k => {
        if (this.mask[k] && _.has(newBody, this.mask[k])) {
          newBody[k] = newBody[this.mask[k]]
          delete newBody[this.mask[k]]
        }
      })
    }
    // sanitized
    if (!params.skipBody) {
      _.each(this.fields, f => {
        if (!_.has(newBody, f.key)) return
        let val
        switch(f.type) {
          case 'text':
          case 'string':
            newBody[f.key] = '' + newBody[f.key]
            break
          case 'integer':
            val = parseInt(newBody[f.key])
            newBody[f.key] = _.isNaN(val) ? null : val
            break
          case 'float':
            val = parseFloat(newBody[f.key])
            newBody[f.key] = _.isNaN(val) ? null : val
            break
          case 'boolean':
            if (typeof newBody[f.key] !== 'boolean') {
              val = '' + newBody[f.key]
              let bools = _.concat(boolTrue, boolFalse)
              if (bools.indexOf(newBody[f.key]) === -1)
                newBody[f.key] = null
              else
                newBody[f.key] = boolTrue.indexOf(newBody[f.key]) > -1
            }
            break
        }
      })
    }
    return newBody
  }

  getFields () {
    return this.fields
  }

  getOrder () {
    return this.order
  }

  getMask () {
    return this.mask
  }

  setOptions (source) {
    source = source || {}
    if (_.isEmpty(source)) {
      return this
    }
    this.fields = []
    this.mask = {}
    this.order = []
    const supported = ['string', 'integer', 'float', 'boolean', 'date', 'datetime', 'text']
    if (_.isArray(source))
      this.fields = source
    else
      _.each(source.fields, f => {
        if (typeof f !== 'object') return
        if (_.isEmpty(f.key)) return
        if (f.subtype !== 'custom' && supported.indexOf(f.type) === -1) return
        if (f.subtype === 'custom')
          delete f.subtype
        let field = {
          key: f.key,
          type: f.type,
          nullable: f.nullable ? true : false,
          required: f.required ? true : false,
          hidden: f.hidden ? true : false
        }
        switch(f.type) {
          case 'string': 
            field.length = parseInt(f.length) || 255
            if (typeof f.default === 'string')
              field.default = f.default
            break
          case 'text': 
            if (typeof f.default === 'string')
              field.default = f.default
            break
          case 'integer':
            if (typeof f.default === 'number')
              field.default = Math.round(f.default)
            break
          case 'float':
            if (typeof f.default === 'number')
              field.default = f.default
            break
          case 'boolean':
            if (typeof f.default === 'boolean')
              field.default = f.default
            break
          case 'date': 
          case 'datetime': 
            if (typeof f.default === 'string' && !_.isEmpty(f.default))
              field.default = f.default
            break
        }
        this.fields.push(field)
      })
    const keys = _.map(this.fields, 'key')
    this.order = source.order || keys
    _.each(this.order, (k, i) => {
      if (keys.indexOf(k) === -1)
        _.pullAt(this.order, i)
    })
    this.mask = source.mask || {}
    _.forOwn(this.mask, (v, k) => {
      if (keys.indexOf(k) === -1)
        delete this.mask[k]
    })
    return this
  }

}

module.exports = BDez