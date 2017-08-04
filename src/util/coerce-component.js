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
 * @param {object} comp : component option object
 * @param {boolean} debug : debug flag
 * @return {object or null}
 */
function coerceComponent (comp, debug) {
  const compOut = {}

  if (isNonEmptyString(comp)) {
    compOut.path = path.join(PATH_TO_COMPONENT, comp)
  } else if (isPlainObj(comp)) {
    if (isNonEmptyString(comp.path)) {
      compOut.path = comp.path
    } else if (isNonEmptyString(comp.name)) {
      compOut.path = path.join(PATH_TO_COMPONENT, comp.name)
    } else {
      if (debug) console.warn(`path to component not found`)
      return null
    }
  } else {
    if (debug) console.warn(`non-string, non-object component passed`)
    return null
  }

  try {
    const _module = require(compOut.path)
    Object.assign(compOut, _module)
  } catch (e) {
    if (debug) console.warn(e)
    return null
  }

  if (isModuleValid(compOut)) {
    compOut.options = isPlainObj(comp.options) ? comp.options : {}
  } else {
    if (debug) console.warn(`invalid component module ${compOut.path}`)
    return null
  }

  return compOut
}

function isModuleValid (_module) {
  return (
    isNonEmptyString(_module.name) &&
    REQUIRED_METHODS.every((m) => typeof _module[m] === 'function')
  )
}

module.exports = coerceComponent
