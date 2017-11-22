/* global Plotly:false */

const remote = require('../../util/remote')

const pad = 0

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

/*

props:
type: 'box', 'split'
boxType: 'plot', 'webpage', 'empty', 'text'
first
second

 */

function render (info, opts, sendToMain) {
  const winWidth = info.width
  const winHeight = info.height
  const imgWidth = (info.width - pad * 3) / 2
  const imgHeight = (info.height - pad * 3) / 2

  let win = remote.createBrowserWindow({
    width: winWidth,
    height: winHeight
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
          margin: 0; 
          padding: 0;
          overflow: hidden;
        }
        img {
          padding: 0;
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
      result.msg = 'dashboard preview generation failed'
    }
    sendToMain(errorCode, result)
  }

  win.on('closed', () => {
    win = null
  })

  const contents = win.webContents

  contents.once('did-finish-load', () => {
    const promises = info.panels.map((p, i) => {
      return Plotly.toImage({
        data: p.data,
        layout: Object.assign({}, p.layout, {width: imgWidth * 2, height: imgHeight}),
        config: config
      }, {
        format: 'png',
        width: imgWidth,
        height: imgHeight,
        imageDataOnly: false
      })
        .then(imgData => {
          contents.executeJavaScript(`new Promise((resolve, reject) => {
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
