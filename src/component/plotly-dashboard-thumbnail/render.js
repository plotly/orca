/* global Plotly:false */

const remote = require('../../util/remote')

const pad = 5
const imgWidth = 200
const imgHeight = 200
const winWidth = 2 * (imgWidth + 2 * pad)
const winHeight = 2 * (imgHeight + 2 * pad)

/**
 * @param {object} info : info object
 *  - layoutType TODO
 *  - direction TODO
 *  - backgroundColor
 *  - panels
 * @param {object} opts : component options
 * @param {function} sendToMain
 *  - errorCode
 *  - result
 *    - imgData
 */
function render (info, opts, sendToMain) {
  let win = remote.createBrowserWindow({
    width: winWidth,
    height: winHeight,
    show: !!opts.debug
  })

  const config = {
    mapboxAccessToken: opts.mapboxAccessToken || '',
    plotGlPixelRatio: opts.plotGlPixelRatio
  }

  const html = window.encodeURIComponent(`<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          width: ${winWidth};
          height: ${winHeight};
          background-color: ${info.backgroundColor};
          overflow: hidden;
          display: inline-block;
          margin: 0;
          overflow: hidden;
        }
        img {
          padding: 5px;
          width: ${imgWidth};
          height: ${imgHeight};
        }
      </style>
    </head>
    <body></body>
  </html>`)

  win.loadURL(`data:text/html,${html}`)

  const result = {}
  let errorCode = null

  const done = () => {
    win.close()

    if (errorCode) {
      result.msg = 'dashboard thumbnail generation failed'
    }
    sendToMain(errorCode, result)
  }

  win.on('closed', () => {
    win = null
  })

  const contents = win.webContents

  contents.once('did-finish-load', () => {
    const promises = info.panels.map(p => {
      return Plotly.toImage({
        data: p.data,
        layout: p.layout,
        config: config
      }, {
        format: 'png',
        width: imgWidth,
        height: imgHeight,
        imageDataOnly: false
      }).then(imgData => {
        contents.executeJavaScript(`
              new Promise((resolve, reject) => {
                const img = document.createElement('img')
                document.body.appendChild(img)
                img.onload = resolve
                img.onerror = reject
                img.src = "${imgData}"
                setTimeout(() => reject(new Error('too long to load image')), 5000)
              })`)
      })
    })

    Promise.all(promises)
      .then(() => {
        setTimeout(() => {
          contents.capturePage(img => {
            result.imgData = img.toPNG()
            done()
          })
        }, 100)
      })
      .catch(() => {
        errorCode = 525
        done()
      })
  })
}

module.exports = render
