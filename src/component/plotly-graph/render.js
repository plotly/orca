/* global Plotly:false */

const semver = require('semver')
const remote = require('../../util/remote')
const cst = require('./constants')

/**
 * @param {object} info : info object
 *  - figure
 *  - format
 *  - width
 *  - height
 *  - scale
 * @param {object} opts : component options
 *  - mapboxAccessToken
 *  - batik
 * @param {function} sendToMain
 *  - errorCode
 *  - result
 *    - imgData
 */
function render (info, opts, sendToMain) {
  const figure = info.figure
  const format = info.format

  const config = Object.assign({},
    {mapboxAccessToken: opts.mapboxAccessToken || ''},
    figure.config
  )

  const result = {}
  let errorCode = null

  const done = () => {
    if (errorCode) {
      result.msg = cst.statusMsg[errorCode]
    }
    sendToMain(errorCode, result)
  }

  // TODO
  // - figure out if we still need this:
  //   https://github.com/plotly/streambed/blob/7311d4386d80d45999797e87992f43fb6ecf48a1/image_server/server_app/main.js#L224-L229

  const PDF_OR_EPS = (format === 'pdf' || format === 'eps')
  const PRINT_TO_PDF = PDF_OR_EPS && !opts.batik

  const imgOpts = {
    format: PDF_OR_EPS ? 'svg' : format,
    width: info.width,
    height: info.height,
    // works as of https://github.com/plotly/plotly.js/compare/to-image-scale
    scale: info.scale,
    // return image data w/o the leading 'data:image' spec
    imageDataOnly: !PRINT_TO_PDF,
    // blend jpeg background color as jpeg does not support transparency
    setBackground: format === 'jpeg' ? 'opaque' : ''
  }

  let promise

  if (semver.gte(Plotly.version, '1.30.0')) {
    promise = Plotly
      .toImage({data: figure.data, layout: figure.layout, config: config}, imgOpts)
      .then((imgData) => {
        if (PRINT_TO_PDF) {
          return toPDF(imgData, imgOpts)
        } else {
          return imgData
        }
      })
  } else if (semver.gte(Plotly.version, '1.11.0')) {
    const gd = document.createElement('div')

    promise = Plotly
      .newPlot(gd, figure.data, figure.layout, config)
      .then(() => Plotly.toImage(gd, imgOpts))
      .then((imgData) => {
        Plotly.purge(gd)

        switch (format) {
          case 'png':
          case 'jpeg':
          case 'webp':
            return imgData.replace(cst.imgPrefix.base64, '')
          case 'svg':
            return decodeSVG(imgData)
          case 'pdf':
          case 'eps':
            if (PRINT_TO_PDF) {
              return toPDF(imgData, imgOpts, info)
            } else {
              return decodeSVG(imgData)
            }
        }
      })
  } else {
    errorCode = 526
    result.error = `plotly.js version: ${Plotly.version}`
    return done()
  }

  promise.then((imgData) => {
    result.imgData = imgData
    return done()
  })
  .catch((err) => {
    errorCode = 525
    result.error = JSON.stringify(err, ['message', 'arguments', 'type', 'name'])
    return done()
  })
}

function decodeSVG (imgData) {
  return window.decodeURIComponent(imgData.replace(cst.imgPrefix.svg, ''))
}

/**
 * See https://github.com/electron/electron/blob/master/docs/api/web-contents.md#contentsprinttopdfoptions-callback
 * for other available options
 */
function toPDF (imgData, imgOpts, info) {
  const win = remote.getCurrentWindow()

  // TODO
  // - how to (robustly) get pixel to microns (for pageSize) conversion factor
  // - this work great, except runner app can't get all pdf to generate
  //   when parallelLimit > 1 ???
  //   + figure out why???
  //   + maybe restrict that in coerce-opts?
  const printOpts = {
    marginsType: 1,
    printSelectionOnly: true,
    pageSize: {
      width: (imgOpts.width) / 0.0035,
      height: (imgOpts.height) / 0.0035
    }
  }

  return new Promise((resolve, reject) => {
    const div = document.createElement('div')
    const img = document.createElement('img')

    document.body.appendChild(div)
    div.appendChild(img)

    img.addEventListener('load', () => {
      window.getSelection().selectAllChildren(div)

      win.webContents.printToPDF(printOpts, (err, pdfData) => {
        document.body.removeChild(div)

        if (err) {
          return reject(new Error('electron print to PDF error'))
        }
        return resolve(pdfData)
      })
    })

    img.addEventListener('error', () => {
      document.body.removeChild(div)
      return reject(new Error('image failed to load'))
    })

    img.src = imgData
  })
}

module.exports = render
