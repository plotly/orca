const isNonEmptyString = require('../../util/is-non-empty-string')

/**
 * @param {object} body : JSON-parsed request body
 *  - url
 *  - pdfOptions
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

  result.pdfOptions = body.pdf_options || {}
  sendToRenderer(null, result)
}

module.exports = parse
