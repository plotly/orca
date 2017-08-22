const Batik = require('../../util/batik')
const cst = require('./constants')

/** plotly-graph convert
 *
 * @param {object} info : info object
 *  - format {string} (from parse)
 *  - imgData {string} (from render)
 * @param {object} opts : component options
 *  - batik {string or instance of Batik}
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

  const done = () => {
    if (errorCode) {
      result.msg = cst.statusMsg[errorCode]
    }
    reply(errorCode, result)
  }

  const toBuffer = () => {
    const body = result.body = Buffer.from(imgData, 'base64')
    result.bodyLength = result.head['Content-Length'] = body.length
    return done()
  }

  const convertSVG = () => {
    const batik = opts.batik instanceof Batik
      ? opts.batik
      : new Batik(opts.batik)

    batik.convertSVG(imgData, {format: format}, (err, buf) => {
      if (err) {
        errorCode = 530
        result.error = err
        return done()
      }

      result.bodyLength = result.head['Content-Length'] = buf.length
      result.body = buf
      return done()
    })
  }

  // TODO
  const pdf2eps = () => {}

  // TODO
  // - is the 'encoded' option still relevant?

  switch (format) {
    case 'png':
    case 'jpeg':
    case 'webp':
      return toBuffer()
    case 'svg':
      // see http://stackoverflow.com/a/12205668/800548
      result.body = imgData
      result.bodyLength = encodeURI(imgData).split(/%..|./).length - 1
      return done()
    case 'pdf':
      if (opts.batik) {
        return convertSVG()
      } else {
        return toBuffer()
      }
    case 'eps':
      if (opts.batik) {
        return convertSVG()
      } else {
        return pdf2eps()
      }
  }
}

module.exports = convert
