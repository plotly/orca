/**
 * @param {object} info
 *  - imgData
 * @param {function} reply
 *  - head
 *  - body
 *  - bodyLength
 */
function convert (info, reply) {
  const result = {}

  result.head = {}
  result.head['Content-Type'] = 'application/pdf'
  result.bodyLength = result.head['Content-Length'] = info.imgData.length
  result.body = Buffer.from(info.imgData, 'base64')

  reply(null, result)
}

module.exports = convert
