const cst = require('./constants')

/**
 * @param {object} info
 * @param {object} opts
 * @param {function} reply
 *  - errorCode {number or null}
 *  - head
 *  - body
 *
 */
function convert (info, opts, reply) {
  let errorCode = null
  let head = {}
  let body

  head['Content-Type'] = cst[info.format]

  switch (info.format) {
    case 'png':
      head['Content-Length'] = info.imgData.length
      body = Buffer.from(info.imgData, 'base64')
      break
    case 'jpeg':
      head['Content-Length'] = info.imgData.length
      body = Buffer.from(info.imgData, 'base64')
      break
  }

  reply(errorCode, head, body)
}

module.exports = convert
