const path = require('path')
const isPlainObj = require('is-plain-obj')

const REQUIRED_METHODS = ['inject', 'parse', 'render', 'convert']
const PATH_TO_COMPONENT = path.join(__dirname, '..', 'component')

// TODO:
// - probably 'inject' should be made optional?
// - maybe all methods should be optional? Would that make sense?

/** Coerce component options
 *
 * @param {object} comp : component option object
 * @return {object or null}
 */
function coerceComponent (comp) {
  const compOut = {}

  if (typeof comp === 'string') {
    compOut.path = path.join(PATH_TO_COMPONENT, comp)
  } else if (isPlainObj(comp)) {
    if (typeof comp.path === 'string') {
      compOut.path = comp.path
    } else if (typeof comp.name === 'string') {
      compOut.path = path.join(PATH_TO_COMPONENT, comp.name)
    } else {
      return null
    }
  } else {
    return null
  }

  try {
    const _module = require(compOut.path)
    Object.assign(compOut, _module)
  } catch (e) {
    return null
  }

  if (isModuleValid(compOut)) {
    compOut.options = isPlainObj(comp.options) ? comp.options : {}
  } else {
    return null
  }

  return compOut
}

function isModuleValid (_module) {
  return (
    typeof _module.name === 'string' && _module.name !== '' &&
    REQUIRED_METHODS.every((m) => typeof _module[m] === 'function')
  )
}

module.exports = coerceComponent
