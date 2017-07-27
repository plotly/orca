const cst = require('./constants')
const isNumeric = require('fast-isnumeric')
const isPlainObj = require('is-plain-obj')

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

  result.encoded = !!opts.encoded
  result.scale = isNumeric(opts.scale) ? Number(opts.scale) : cst.dflt.scale
  result.thumbnail = !!opts.thumbnail

  result.fid = typeof opts.fid === 'string' ? opts.fid : null

  if (typeof opts.format === 'string') {
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

  if (figure.data) {
    if (Array.isArray(figure.data)) {
      result.figure.data = figure.data
    } else {
      return errorOut(400, 'non-array figure data')
    }
  } else {
    result.figure.data = []
  }

  if (figure.layout) {
    if (isPlainObj(figure.layout)) {
      result.figure.layout = figure.layout
    } else {
      return errorOut(400, 'non-object figure layout')
    }
  } else {
    result.figure.layout = {}
  }

  result.width = isNumeric(opts.width) ? Number(opts.width)
    : isNumeric(result.figure.layout.width) ? Number(result.figure.layout.width)
    : cst.dflt.width

  result.height = isNumeric(opts.height) ? Number(opts.height)
    : isNumeric(result.figure.layout.height) ? Number(result.figure.layout.height)
    : cst.dflt.height

  sendToRenderer(null, result)
}

module.exports = parse
