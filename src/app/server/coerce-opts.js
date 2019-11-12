const coerceComponent = require('../../util/coerce-component')
const isPositiveNumeric = require('../../util/is-positive-numeric')
const cst = require('./constants')

/** Coerce server options
 *
 * @param {object} _opts : (user) server options container
 * @return {object} coerce options including:
 *  - _browserWindowOpts {object}
 *  - _componentLookup {object}
 */
function coerceOpts (_opts = {}) {
  const opts = {}

  if (isPositiveNumeric(_opts.port)) {
    opts.port = Number(_opts.port)
  } else {
    throw new Error('invalid port number')
  }

  opts.maxNumberOfWindows = isPositiveNumeric(_opts.maxNumberOfWindows)
    ? Number(_opts.maxNumberOfWindows)
    : cst.dflt.maxNumberOfWindows

  opts.debug = !!_opts.debug
  opts.cors = !!_opts.cors
  opts._browserWindowOpts = {
    show: !!opts.debug,
    // Starting with Electron 5 we need the following
    // see: https://stackoverflow.com/questions/44391448/electron-require-is-not-defined
    webPreferences: {
      nodeIntegration: true
    }
  }

  const _components = Array.isArray(_opts.component) ? _opts.component : [_opts.component]
  const componentLookup = {}
  opts.component = []

  _components.forEach((_comp) => {
    const comp = coerceComponent(_comp, opts.debug)

    if (comp) {
      if (componentLookup[comp.route]) {
        throw new Error('trying to register multiple components on same route')
      }

      componentLookup[comp.route] = comp
      opts.component.push(comp)
    }
  })

  if (opts.component.length === 0) {
    throw new Error('no valid component registered')
  }

  opts._componentLookup = componentLookup

  opts.requestTimeout = isPositiveNumeric(_opts.requestTimeout)
    ? Number(_opts.requestTimeout) * 1000
    : cst.dflt.requestTimeout * 1000

  return opts
}

module.exports = coerceOpts
