const cst = require('./constants')
const isNumeric = require('fast-isnumeric')
const isPlainObj = require('is-plain-obj')

function parse (body, _opts, sendToRenderer) {
  const info = {}
  let figure
  let opts

  const errorOut = (code, extra) => {
    sendToRenderer(code, `${cst.statusMsg[code]} (${extra})`)
  }

  // to support both serve & run body structures
  if (body.figure) {
    figure = body.figure
    opts = body
  } else {
    figure = body
    opts = _opts
  }

  info.encoded = !!opts.encoded
  info.scale = isNumeric(opts.scale) ? Number(opts.scale) : cst.dflt.scale
  info.thumbnail = !!opts.thumbnail

  if (typeof opts.fig === 'string') {
    info.fid = opts.fid
  }

  if (typeof opts.format === 'string') {
    if (cst.contentFormat[opts.format]) {
      info.format = opts.format
    } else {
      return errorOut(400, 'wrong format')
    }
  } else {
    info.format = cst.dflt.format
  }

  if (!isPlainObj(figure)) {
    return errorOut(400, 'non-object figure')
  }

  if (!figure.data && !figure.layout) {
    return errorOut(400, 'no \'data\' and no \'layout\' in figure')
  }

  info.figure = {}

  if (figure.data) {
    if (Array.isArray(figure.data)) {
      info.figure.data = figure.data
    } else {
      return errorOut(400, 'non-array figure data')
    }
  } else {
    info.figure.data = []
  }

  if (figure.layout) {
    if (isPlainObj(figure.layout)) {
      info.figure.layout = figure.layout
    } else {
      return errorOut(400, 'non-object figure layout')
    }
  } else {
    info.figure.layout = {}
  }

  info.width = isNumeric(opts.width) ? Number(opts.width)
    : isNumeric(info.figure.layout.width) ? Number(info.figure.layout.width)
    : cst.dflt.width

  info.height = isNumeric(opts.height) ? Number(opts.height)
    : isNumeric(info.figure.layout.height) ? Number(info.figure.layout.height)
    : cst.dflt.height

  sendToRenderer(null, info)
}

module.exports = parse
