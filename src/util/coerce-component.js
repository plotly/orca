const path = require('path')
const isPlainObj = require('is-plain-obj')
const isNonEmptyString = require('./is-non-empty-string')

const REQUIRED_METHODS = ['ping', 'parse', 'render', 'convert']
const PATH_TO_COMPONENT = path.join(__dirname, '..', 'component')
const NOOP = function () {}

/** Coerce component options
 *
 * @param {object} _comp : user component option object
 * @param {object} opts : app options
 *  - debug
 * @return {object or null} :
 *  full component option object or null (if component is invalid)
 */
function coerceComponent (_comp, opts = {}) {
  const debug = opts.debug
  const comp = {}

  if (isNonEmptyString(_comp)) {
    comp.path = path.join(PATH_TO_COMPONENT, _comp)
  } else if (isPlainObj(_comp)) {
    if (isNonEmptyString(_comp.path)) {
      comp.path = _comp.path
    } else if (isNonEmptyString(_comp.name)) {
      comp.path = path.join(PATH_TO_COMPONENT, _comp.name)
    } else {
      if (debug) console.warn(`path to component not found`)
      return null
    }
  } else {
    if (debug) console.warn(`non-string, non-object component passed`)
    return null
  }

  try {
    comp._module = require(comp.path)
    comp.name = comp._module.name
  } catch (e) {
    if (debug) console.warn(e)
    return null
  }

  if (!isModuleValid(comp._module)) {
    if (debug) console.warn(`invalid component module ${comp.path}`)
    return null
  }

  if (isPlainObj(_comp)) {
    const r = isNonEmptyString(_comp.route) ? _comp.route : comp.name
    comp.route = r.charAt(0) === '/' ? r : '/' + r

    comp.options = isPlainObj(_comp.options)
      ? Object.assign({}, _comp.options)
      : {}
  } else {
    comp.route = '/' + comp.name
    comp.options = {}
  }

  if (typeof comp._module.inject !== 'function') {
    comp._module.inject = NOOP
  }

  return comp
}

function isModuleValid (_module) {
  return (
    isNonEmptyString(_module.name) &&
    REQUIRED_METHODS.every((m) => typeof _module[m] === 'function')
  )
}

module.exports = coerceComponent
