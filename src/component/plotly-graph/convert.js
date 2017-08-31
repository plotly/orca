const Pdftops = require('../../util/pdftops')
const cst = require('./constants')

/** plotly-graph convert
 *
 * @param {object} info : info object
 *  - format {string} (from parse)
 *  - imgData {string} (from render)
 * @param {object} opts : component options
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

  const result = {
    head: {'Content-Type': cst.contentFormat[format]}
  }

  let errorCode = null
  let body
  let bodyLength

  const done = () => {
    if (errorCode) {
      result.msg = cst.statusMsg[errorCode]
    } else {
      result.body = body
      result.bodyLength = result.head['Content-Length'] = bodyLength
    }
    reply(errorCode, result)
  }

  const pdf2eps = (pdf, cb) => {
    const pdftops = opts.pdftops instanceof Pdftops
      ? opts.pdftops
      : new Pdftops(opts.pdftops)

    pdftops.pdf2eps(pdf, {id: info.id}, (err, eps) => {
      if (err) {
        errorCode = 530
        result.error = err
        return done()
      }
      cb(eps)
    })
  }

  // TODO
  // - is the 'encoded' option still relevant?

  switch (format) {
    case 'png':
    case 'jpeg':
    case 'webp':
    case 'pdf':
      body = Buffer.from(imgData, 'base64')
      bodyLength = body.length
      return done()
    case 'svg':
      // see http://stackoverflow.com/a/12205668/800548
      body = imgData
      bodyLength = encodeURI(imgData).split(/%..|./).length - 1
      return done()
    case 'eps':
      pdf2eps(imgData, (eps) => {
        body = eps
        bodyLength = body.length
        return done()
      })
      break
  }
}

module.exports = convert
