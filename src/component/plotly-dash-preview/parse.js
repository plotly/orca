const isUrl = require('is-url')
const cst = require('./constants')
const isPositiveNumeric = require('../../util/is-positive-numeric')
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

  if (isUrl(body.url)) {
    result.url = body.url
  } else {
    return errorOut(400, 'invalid url')
  }

  result.pdfOptions = body.pdf_options || {}
  if (!isNonEmptyString(body.selector) && !isPositiveNumeric(body.timeout)) {
    return errorOut(400, 'either selector or timeout must be specified')
  }

  result.selector = body.selector
  result.timeOut = body.timeout
  result.tries = Number(result.timeOut * 1000 / cst.minInterval)

  if (cst.sizeMapping[result.pdfOptions.pageSize]) {
    result.browserSize = cst.sizeMapping[result.pdfOptions.pageSize]
  } else if (body.pageSize && isPositiveNumeric(body.pageSize.width) &&
             isPositiveNumeric(body.pageSize.height)) {
    result.browserSize = {
      width: body.pageSize.width * cst.pixelsInMicron,
      height: body.pageSize.height * cst.pixelsInMicron
    }
  } else {
    return errorOut(
      400,
      'pageSize must either be A3, A4, A5, Legal, Letter, ' +
      'Tabloid or an Object containing height and width ' +
      'in microns.'
    )
  }

  sendToRenderer(null, result)
}

module.exports = parse
