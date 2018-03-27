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
  if (!body.loading_selector && !body.timeout) {
    return errorOut(400, 'either loading_selector or timeout must be specified')
  }

  result.loadingSelector = body.loading_selector
  result.timeOut = body.timeout

  sendToRenderer(null, result)
}

module.exports = parse
