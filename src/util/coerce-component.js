const path = require('path')
const isPlainObj = require('is-plain-obj')
const isNonEmptyString = require('./is-non-empty-string')

const REQUIRED_METHODS = ['inject', 'parse', 'render', 'convert']
const PATH_TO_COMPONENT = path.join(__dirname, '..', 'component')

// TODO:
// - probably 'inject' should be made optional?
// - maybe all methods should be optional? Would that make sense?

/** Coerce component options
 *
 * @param {object} _comp : user component option object
 * @param {boolean} debug : debug flag
 * @return {object or null} :
 *  full component option object or null (if component is invalid)
 */
function coerceComponent (_comp, debug) {
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
    const _module = require(comp.path)
    Object.assign(comp, _module)
  } catch (e) {
    if (debug) console.warn(e)
    return null
  }

  if (!isModuleValid(comp)) {
    if (debug) console.warn(`invalid component module ${comp.path}`)
    return null
  }

  if (isPlainObj(_comp)) {
    if ('route' in _comp) {
      const route = isNonEmptyString(_comp.route) ? _comp.route : _comp.name
      comp.route = route.charAt(0) === '/' ? route : '/' + route
    }

    if (Array.isArray(comp.availableOptions)) {
      comp.availableOptions.forEach((k) => {
        if (k in _comp) {
          comp[k] = _comp[k]
        }
      })
    }

    if (debug) {
      Object.keys(_comp).forEach((k) => {
        if (!(k in comp)) {
          console.log(`${k} is not an available option for component ${comp.name}`)
        }
      })
    }
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
