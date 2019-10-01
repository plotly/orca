const isUrl = require('is-url')
const cst = require('./constants')
const isPositiveNumeric = require('../../util/is-positive-numeric')
const isNonEmptyString = require('../../util/is-non-empty-string')

/**
 * @param {object} body : JSON-parsed request body
 *  - url
 *  - pdfOptions
 * @param {object} req: HTTP request
 * @param {object} opts : component options
 * @param {function} sendToRenderer
 * - errorCode
 * - result
 */
function parse (body, req, opts, sendToRenderer) {
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

  var pageSize
  if (result.pdfOptions.pageSize) {
    pageSize = result.pdfOptions.pageSize
  } else if (body.pageSize) {
    pageSize = body.pageSize
  }

  if (cst.sizeMapping[pageSize]) {
    result.browserSize = cst.sizeMapping[pageSize]
    result.pdfOptions.pageSize = pageSize
  } else if (pageSize && isPositiveNumeric(pageSize.width) &&
             isPositiveNumeric(pageSize.height)) {
    result.browserSize = {
      width: pageSize.width * cst.pixelsInMicron,
      height: pageSize.height * cst.pixelsInMicron
    }
    result.pdfOptions.pageSize = {
      width: Math.ceil(pageSize.width),
      height: Math.ceil(pageSize.height)
    }
  } else {
    return errorOut(
      400,
      'pageSize must either be A3, A4, A5, Legal, Letter, ' +
      'Tabloid or an Object containing height and width ' +
      'in microns.'
    )
  }

  // Change browser size orientation if landscape
  if (result.pdfOptions.landscape) {
    result.browserSize = { width: result.browserSize.height, height: result.browserSize.width }
  }

  // BrowserWindow only accepts integer values:
  result.browserSize['width'] = Math.ceil(result.browserSize['width'])
  result.browserSize['height'] = Math.ceil(result.browserSize['height'])

  sendToRenderer(null, result)
}

module.exports = parse
