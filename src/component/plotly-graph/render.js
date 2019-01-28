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
 *  - encoded
 * @param {object} opts : component options
 *  - mapboxAccessToken
 *  - plotGlPixelRatio
 * @param {function} sendToMain
 *  - errorCode
 *  - result
 *    - imgData
 */
function render (info, opts, sendToMain) {
  const figure = info.figure
  const format = info.format
  const encoded = info.encoded

  const config = Object.assign({
    mapboxAccessToken: opts.mapboxAccessToken || null,
    plotGlPixelRatio: opts.plotGlPixelRatio || cst.plotGlPixelRatio
  }, figure.config)

  const result = {}
  let errorCode = null

  const done = () => {
    if (errorCode) {
      result.msg = cst.statusMsg[errorCode]
    }
    sendToMain(errorCode, result)
  }

  const PRINT_TO_PDF = (format === 'pdf' || format === 'eps')
  const PRINT_TO_EMF = (format === 'emf')

  // stash `paper_bgcolor` here in order to set the pdf window bg color
  let bgColor
  const pdfBackground = (gd, _bgColor) => {
    if (!bgColor) bgColor = _bgColor
    gd._fullLayout.paper_bgcolor = 'rgba(0,0,0,0)'
  }

  const imgOpts = {
    format: (PRINT_TO_PDF || PRINT_TO_EMF) ? 'svg' : format,
    width: info.width,
    height: info.height,
    // only works as of plotly.js v1.31.0
    scale: info.scale,
    // return image data w/o the leading 'data:image' spec
    imageDataOnly: PRINT_TO_EMF || (!PRINT_TO_PDF && !encoded),
    // blend (emf|jpeg) background color as (emf|jpeg) does not support transparency
    setBackground: (format === 'jpeg' || format === 'emf') ? 'opaque'
      : PRINT_TO_PDF ? pdfBackground
        : ''
  }

  let promise

  if (semver.gte(Plotly.version, '1.30.0')) {
    promise = Plotly
      .toImage({ data: figure.data, layout: figure.layout, config: config }, imgOpts)
      .then((imgData) => {
        if (PRINT_TO_PDF) {
          return toPDF(imgData, imgOpts, bgColor)
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
            if (encoded) {
              return imgData
            } else {
              return imgData.replace(cst.imgPrefix.base64, '')
            }
          case 'svg':
            if (encoded) {
              return imgData
            } else {
              return decodeSVG(imgData)
            }
          case 'pdf':
          case 'eps':
            return toPDF(imgData, imgOpts, bgColor)
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
  }).catch((err) => {
    errorCode = 525
    result.error = JSON.stringify(err, ['message', 'arguments', 'type', 'name'])
    return done()
  })
}

function decodeSVG (imgData) {
  return window.decodeURIComponent(imgData.replace(cst.imgPrefix.svg, ''))
}

function toPDF (imgData, imgOpts, bgColor) {
  const wPx = imgOpts.scale * imgOpts.width
  const hPx = imgOpts.scale * imgOpts.height

  const pxByMicrometer = 0.00377957517575025
  const offset = 6

  // See other available options:
  // https://github.com/electron/electron/blob/master/docs/api/web-contents.md#contentsprinttopdfoptions-callback
  const printOpts = {
    // no margins
    marginsType: 1,
    // make bg (set to `paper_bgcolor` value) appear in export
    printBackground: true,
    // printToPDF expects page size setting in micrometer (1e-6 m)
    // - Px by micrometer factor is taken from
    //   https://www.translatorscafe.com/unit-converter/en/length/13-110/micrometer-pixel/
    // - Even under the `marginsType: 1` setting (meaning no margins), printToPDF still
    //   outputs small margins. We need to take this into consideration so that the output PDF
    //   does not span multiple pages. The offset value was found empirically via trial-and-error.
    pageSize: {
      width: (wPx + offset) / pxByMicrometer,
      height: (hPx + offset) / pxByMicrometer
    }
  }

  return new Promise((resolve, reject) => {
    let win = remote.createBrowserWindow({
      width: wPx,
      height: hPx,
      show: !!imgOpts.debug
    })

    win.on('closed', () => {
      win = null
    })

    const html = window.encodeURIComponent(`<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: ${bgColor}
          }
        </style>
      </head>
      <body><img/></body>
    </html>`)

    // we can't set image src into html as chromium has a 2MB URL limit
    // https://craignicol.wordpress.com/2016/07/19/excellent-export-and-the-chrome-url-limit/

    win.loadURL(`data:text/html,${html}`)

    win.webContents.executeJavaScript(`new Promise((resolve, reject) => {
      const img = document.body.firstChild
      img.onload = resolve
      img.onerror = reject
      img.src = "${imgData}"
      setTimeout(() => reject(new Error('too long to load image')), ${cst.pdfPageLoadImgTimeout})
    })`).then(() => {
      win.webContents.printToPDF(printOpts, (err, pdfData) => {
        if (err) {
          reject(err)
        } else {
          resolve(pdfData)
        }
        win.close()
      })
    }).catch((err) => {
      reject(err)
      win.close()
    })
  })
}

module.exports = render
