const isNonEmptyString = require('../../util/is-non-empty-string')

/**
 * @param {object} body : JSON-parsed request body
 *  - url
 *  - share_key
 *  - parameters
 * @param {object} opts : component options
 * @param {function} sendToRenderer
 * - errorCode
 * - result
 */
function parse (body, opts, sendToRenderer) {
  const result = {}

  const errorOut = (code, msg) => {
    result.msg = msg
    sendToRenderer(code, result)
  }

  if (isNonEmptyString(body.url)) {
    result.url = body.url
  } else {
    return errorOut(400, 'invalid url')
  }

  sendToRenderer(null, result)
}

module.exports = parse
