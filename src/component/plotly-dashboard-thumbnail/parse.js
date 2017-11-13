const isPlainObj = require('is-plain-obj')
const isNonEmptyString = require('../../util/is-non-empty-string')
const overrideFigure = require('../plotly-thumbnail/parse').overrideFigure

const seq = ['first', 'second', 'third', 'forth']

/**
 * @param {object} body : JSON-parsed request body
 *  - layout:
 *    - type
 *    - direction
 *    - first, second, third, forth:
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

  const layout = body.layout

  if (isPlainObj(layout)) {
    result.layoutType = layout.type
    result.direction = layout.direction

    result.panels = seq.map(s => {
      const spec = layout[s] || {}
      let figure

      switch (spec.boxType) {
        case 'plot':
          figure = {
            data: spec.figure.data || [],
            layout: spec.figure.layout || {}
          }
          break

        case 'text':
          figure = {
            data: [],
            layout: {
              annotations: [{
                text: 'copy text panel here'
              }]
            }
          }
          break

        default:
          figure = {
            data: [],
            layout: {}
          }
          break
      }

      overrideFigure(figure)
      return figure
    })
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
