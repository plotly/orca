const glob = require('glob')
const isPlainObj = require('is-plain-obj')
const coerceComponent = require('../../util/coerce-component')
const isPositiveNumeric = require('../../util/is-positive-numeric')
const isNonEmptyString = require('../../util/is-non-empty-string')
const cst = require('./constants')

/** Coerce runner options
 *
 * @param {object} _opts : (user) runner options container
 * @return {object} coerce options including:
 *  - _browserWindowOpts {object}
 */
function coerceOpts (_opts = {}) {
  const opts = {}

  opts.debug = !!_opts.debug
  opts._browserWindowOpts = { show: !!opts.debug }

  opts.parallelLimit = isPositiveNumeric(_opts.parallelLimit)
    ? Number(_opts.parallelLimit)
    : cst.dflt.parallelLimit

  const _comp = Array.isArray(_opts.component) ? _opts.component[0] : _opts.component
  const comp = coerceComponent(_comp, opts.debug)

  if (comp) {
    opts.component = comp
  } else {
    throw new Error('no valid component registered')
  }

  const _input = Array.isArray(_opts.input) ? _opts.input : [_opts.input]
  let input = []

  _input.forEach((item) => {
    if (isNonEmptyString(item)) {
      const matches = glob.sync(item)

      if (matches.length === 0) {
        input.push(item)
      } else {
        input = input.concat(matches)
      }
    } else if (isPlainObj(item)) {
      input.push(item)
    }
  })

  if (input.length === 0) {
    throw new Error('no valid input given')
  }

  opts.write = typeof _opts.write === 'function'
    ? _opts.write
    : false

  opts.input = input

  return opts
}

module.exports = coerceOpts
