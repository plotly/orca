const isNonEmptyString = require('../../util/is-non-empty-string')

/**
 * @param {object} body : JSON-parsed request body
 *  - url
 *  - width
 *  - height
 *  - fid
 * @param {object} opts : component options
 * @param {function} sendToRenderer
 *  - errorCode
 *  - result
 */
function parse (body, opts, sendToRenderer) {
  const result = {}

  const errorOut = (code) => {
    result.msg = 'missing dashboard url'
    sendToRenderer(code, result)
  }

  result.fid = isNonEmptyString(body.fid) ? body.fid : null

  if (isNonEmptyString(body.url)) {
    result.url = body.url
  } else {
    return errorOut(400)
  }

  result.width = body.width || 800
  result.height = body.height || 600

  sendToRenderer(null, result)
}

module.exports = parse
