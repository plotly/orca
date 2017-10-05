const cst = require('./constants')
const isPlainObj = require('is-plain-obj')
const isPositiveNumeric = require('../../util/is-positive-numeric')
const isNonEmptyString = require('../../util/is-non-empty-string')

/** plotly-graph parse
 *
 * @param {object} body : JSON-parsed request body
 *  - figure
 *  - format
 *  - scale
 *  - width
 *  - height
 *  - encoded
 *  - fid (figure id)
 * 0r:
 *  - data
 *  - layout
 * @param {object} _opts : component options
 *  - format
 *  - scale
 *  - width
 *  - height
 * @param {function} sendToRenderer
 *  - errorCode
 *  - result
 */
function parse (body, _opts, sendToRenderer) {
  const result = {}

  const errorOut = (code, extra) => {
    result.msg = `${cst.statusMsg[code]} (${extra})`
    sendToRenderer(code, result)
  }

  let figure
  let opts

  // to support both 'serve' requests (figure/format/../)
  // and 'run' body (data/layout) structures
  if (body.figure) {
    figure = body.figure
    opts = body
  } else {
    figure = body
    opts = _opts
  }

  result.scale = isPositiveNumeric(opts.scale) ? Number(opts.scale) : cst.dflt.scale
  result.fid = isNonEmptyString(opts.fid) ? opts.fid : null
  result.encoded = !!opts.encoded

  if (isNonEmptyString(opts.format)) {
    if (cst.contentFormat[opts.format]) {
      result.format = opts.format
    } else {
      return errorOut(400, 'wrong format')
    }
  } else {
    result.format = cst.dflt.format
  }

  if (!isPlainObj(figure)) {
    return errorOut(400, 'non-object figure')
  }

  if (!figure.data && !figure.layout) {
    return errorOut(400, 'no \'data\' and no \'layout\' in figure')
  }

  result.figure = {}

  if ('data' in figure) {
    if (Array.isArray(figure.data)) {
      result.figure.data = figure.data
    } else {
      return errorOut(400, 'non-array figure data')
    }
  } else {
    result.figure.data = []
  }

  if ('layout' in figure) {
    if (isPlainObj(figure.layout)) {
      result.figure.layout = figure.layout
    } else {
      return errorOut(400, 'non-object figure layout')
    }
  } else {
    result.figure.layout = {}
  }

  result.width = parseDim(result, opts, 'width')
  result.height = parseDim(result, opts, 'height')

  sendToRenderer(null, result)
}

function parseDim (result, opts, dim) {
  const layout = result.figure.layout

  if (isPositiveNumeric(opts[dim])) {
    return Number(opts[dim])
  } else if (isPositiveNumeric(layout[dim]) && !layout.autosize) {
    return Number(layout[dim])
  } else {
    return cst.dflt[dim]
  }
}

module.exports = parse
