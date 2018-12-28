const Pdftops = require('../../util/pdftops')
const Inkscape = require('../../util/inkscape')
const cst = require('./constants')

/** plotly-graph convert
 *
 * @param {object} info : info object
 *  - format {string} (from parse)
 *  - encoded {string} (from parse)
 *  - imgData {string} (from render)
 * @param {object} opts : component options
 *  - pdftops {string or instance of Pdftops)
 *  - inkscape {string or instance of Inkscape)
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
  const encoded = info.encoded

  const result = {}
  let errorCode = null
  let body
  let bodyLength

  const done = () => {
    if (errorCode) {
      result.msg = cst.statusMsg[errorCode]
    } else {
      result.body = body
      result.bodyLength = bodyLength
      result.head = {
        'Content-Type': cst.contentFormat[format],
        'Content-Length': bodyLength
      }
    }
    reply(errorCode, result)
  }

  const pdf2eps = (pdf, cb) => {
    const pdftops = opts.pdftops instanceof Pdftops
      ? opts.pdftops
      : new Pdftops(opts.pdftops)

    pdftops.pdf2eps(pdf, { id: info.id }, (err, eps) => {
      if (err) {
        errorCode = 530
        result.error = err
        return done()
      }
      cb(eps)
    })
  }

  const svg2emf = (svg, cb) => {
    const inkscape = opts.inkscape instanceof Inkscape
      ? opts.inkscape
      : new Inkscape(opts.inkscape)

    try {
      inkscape.CheckInstallation()
    } catch (e) {
      errorCode = 530
      result.error = e
      return done()
    }

    inkscape.svg2emf(svg, { id: info.id, figure: info.figure }, (err, emf) => {
      if (err) {
        errorCode = 530
        result.error = err
        return done()
      }
      cb(emf)
    })
  }

  switch (format) {
    case 'png':
    case 'jpeg':
    case 'webp':
      body = encoded
        ? imgData
        : Buffer.from(imgData, 'base64')
      bodyLength = body.length
      return done()
    case 'pdf':
      body = encoded
        ? `data:${cst.contentFormat.pdf};base64,${imgData.toString('base64')}`
        : Buffer.from(imgData, 'base64')
      bodyLength = body.length
      return done()
    case 'svg':
      // see http://stackoverflow.com/a/12205668/800548
      body = imgData
      bodyLength = encodeURI(imgData).split(/%..|./).length - 1
      return done()
    case 'eps':
      pdf2eps(imgData, (eps) => {
        body = encoded
          ? `data:${cst.contentFormat.eps};base64,${eps.toString('base64')}`
          : Buffer.from(eps, 'base64')
        bodyLength = body.length
        return done()
      })
      break
    case 'emf':
      svg2emf(imgData, (emf) => {
        body = encoded
          ? `data:${cst.contentFormat.emf};base64,${emf.toString('base64')}`
          : Buffer.from(emf, 'base64')
        bodyLength = body.length
        return done()
      })
      break
  }
}

module.exports = convert
