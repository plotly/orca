const isPlainObj = require('is-plain-obj')
const isNonEmptyString = require('../../util/is-non-empty-string')
const overrideFigure = require('../plotly-thumbnail/parse').overrideFigure

/**
 * @param {object} body : JSON-parsed request body
 *  - layout:
 *    - type
 *    - direction
 *    - first, second:
 *      - boxType
 *      - figure
 *  - settings:
 *    - backgroundColor
 * @param {object} opts : component options
 * @param {function} sendToRenderer
 * - errorCode
 * - result
 */
function parse (body, opts, sendToRenderer) {
  const result = {}

  const errorOut = (code) => {
    result.msg = 'invalid body'
    sendToRenderer(code, result)
  }

  result.fid = isNonEmptyString(body.fid) ? body.fid : null

  const layout = body.figure.layout
  result.panels = []

  const parseFromType = (cont) => {
    switch (cont.type) {
      case 'split':
        parseFromType(cont.first)
        parseFromType(cont.second)
        break
      case 'box':
        parseFromBoxType(cont)
        break
    }
  }

  const parseFromBoxType = (cont) => {
    if (cont.boxType === 'plot') {
      const figure = {
        data: cont.figure.data || [],
        layout: cont.figure.layout || {}
      }
      overrideFigure(figure)
      result.panels.push(figure)
    }
  }

  if (isPlainObj(layout)) {
    parseFromType(layout)
  } else {
    return errorOut(400)
  }

  const settings = body.settings

  if (isPlainObj(settings) && isNonEmptyString(settings.backgroundColor)) {
    result.backgroundColor = settings.backgroundColor
  } else {
    result.backgroundColor = '#fff'
  }

  sendToRenderer(null, result)
}

module.exports = parse
