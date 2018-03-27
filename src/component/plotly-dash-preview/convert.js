const cst = require('../plotly-graph/constants')

/**
 * @param {object} info : info object
 *  - imgData
 * @param {object} opts : component options
 * @param {function} reply
 *  - errorCode
 *  - result
 */
function convert (info, opts, reply) {
  const result = {}

  result.head = {}
  result.head['Content-Type'] = cst.contentFormat.pdf
  result.bodyLength = result.head['Content-Length'] = info.imgData.length
  result.body = Buffer.from(info.imgData, 'base64')

  reply(null, result)
}

module.exports = convert
