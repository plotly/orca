const cst = require('./constants')

/**
 * @param {object} info
 *  - format {string} (from parse)
 *  - imgData {string} (from render)
 * @param {object} opts
 *  - pathToBatik {string}
 * @param {function} reply
 *  - errorCode {number or null}
 *  - result {object}
 *    - head
 *    - body
 *    - bodyLength
 */
function convert (info, opts, reply) {
  let errorCode = null

  const result = {
    head: {'Content-Type': cst[info.format]}
  }

  // TODO
  // - should pdf and eps format be part of a streambed-only component?
  // - should we use batik for that or something?
  // - implement 'svg' and 'webp'
  // - is the 'encoded' option still relevant?

  switch (info.format) {
    case 'png':
      result.bodyLength = result.head['Content-Length'] = info.imgData.length
      result.body = Buffer.from(info.imgData, 'base64')
      break
    case 'jpeg':
      result.bodyLength = result.head['Content-Length'] = info.imgData.length
      result.body = Buffer.from(info.imgData, 'base64')
      break
  }

  reply(errorCode, result)
}

module.exports = convert
