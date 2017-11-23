const isPlainObj = require('is-plain-obj')
const isNonEmptyString = require('../../util/is-non-empty-string')

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

  const errorOut = code => {
    result.msg = 'invalid body'
    sendToRenderer(code, result)
  }

  result.fid = isNonEmptyString(body.fid) ? body.fid : null

  const dashboardLayout = body.layout

  const parseFromType = cont => {
    switch (cont.type) {
      case 'split':
        return {
          type: 'split',
          panels: [cont.first, cont.second].map(parseFromType)
        }
      case 'box':
        return parseFromBoxType(cont)
    }
  }

  const parseFromBoxType = cont => {
    switch (cont.boxType) {
      case 'plot':
        return {
          type: 'box',
          contents: {
            data: cont.figure.data || [],
            layout: cont.figure.layout || {}
          }
        }

      case 'text':
        return {
          type: 'box',
          contents: {
            data: [],
            layout: {},
            annotations: [{text: cont.text.substr(50)}]
          }
        }

      default:
        return {
          type: 'box',
          contents: {
            data: [],
            layout: {}
          }
        }
    }
  }

  if (isPlainObj(dashboardLayout)) {
    result.panels = parseFromType(dashboardLayout)
  } else {
    return errorOut(400)
  }

  const settings = body.settings

  if (isPlainObj(settings) && isNonEmptyString(settings.backgroundColor)) {
    result.backgroundColor = settings.backgroundColor
  } else {
    result.backgroundColor = '#fff'
  }

  result.width = body.width || 800
  result.height = body.height || 600

  sendToRenderer(null, result)
}

module.exports = parse
