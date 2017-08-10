const cst = require('./constants')

/** plotly-graph convert
 *
 * @param {object} info : info object
 *  - format {string} (from parse)
 *  - imgData {string} (from render)
 * @param {object} opts : component options
 *  - pathToBatik (maybe?)
 * @param {function} reply
 *  - errorCode {number or null}
 *  - result {object}
 *    - head
 *    - body
 *    - bodyLength
 */
function convert (info, opts, reply) {
  const imgData = info.imgData
  const format = info.format

  let errorCode = null

  const result = {
    head: {'Content-Type': cst.contentFormat[format]}
  }

  // TODO
  // - should pdf and eps format be part of a streambed-only component?
  // - should we use batik for that or something?
  // - is the 'encoded' option still relevant?

  switch (format) {
    case 'png':
    case 'jpeg':
    case 'webp':
      result.bodyLength = result.head['Content-Length'] = imgData.length
      result.body = Buffer.from(imgData, 'base64')
      break
    case 'svg':
      // see http://stackoverflow.com/a/12205668/800548
      result.bodyLength = encodeURI(imgData).split(/%..|./).length - 1
      result.body = imgData
  }

  reply(errorCode, result)
}

module.exports = convert
