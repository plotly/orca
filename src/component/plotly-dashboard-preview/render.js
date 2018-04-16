/* global Plotly:false */

const remote = require('../../util/remote')
const separator = 12

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
  const winWidth = info.width
  const winHeight = info.height

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
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        img {
          display: block;
          padding: 0;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          margin: ${separator}px;
        }
        div {
          padding: 0;
          margin: 0;
          display: flex;
          min-width: 0;
          min-height: 0;
          width: 100%;
          height: 100%;
          flex: 1 1 0%;
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

  const renderOnePlot = (p, idArray, imgWidth, imgHeight) => {
    return Plotly.toImage({
      data: p.data,
      layout: p.layout,
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
          const root = document.getElementById('gd_${idArray.join('_')}')
          root.appendChild(img)
          img.onload = resolve
          img.onerror = reject
          img.src = '${imgData}'
          setTimeout(() => reject(new Error('too long to load image')), 5000)
        })`)
      })
  }

  const renderOneDiv = (idArray, verticalContainer) => {
    contents.executeJavaScript(`new Promise((resolve, reject) => {
          const root = ${idArray.length} ? document.getElementById('gd_${idArray.slice(0, -1).join('_')}') : document.body
          const div = document.createElement('div')
          div.setAttribute('id', 'gd_${idArray.join('_')}')
          if(${verticalContainer}) {
            div.style['flex-direction'] = 'column'
          }
          root.appendChild(div)
        })`)
  }

  contents.once('did-finish-load', () => {
    const promises = []

    const traversePanels = (p, path, width, height) => {
      const dir = p.direction
      const size = p.size
      const sizeUnit = p.sizeUnit
      renderOneDiv(path, p.type === 'split' && dir === 'vertical')
      switch (p.type) {
        case 'box': {
          promises.push(renderOnePlot(p.contents, path, width, height))
          break
        }
        case 'split': {
          let multiplier = 1 / p.panels.length
          if (p.panels.length) {
            if (sizeUnit === '%') {
              multiplier = size / 100
            } else if (sizeUnit === 'px') {
              multiplier = size / (dir === 'vertical' ? height : width)
            }
          }
          const newWidths = dir === 'vertical'
            ? [width, width]
            : [width * multiplier, width * (1 - multiplier) - 2 * separator]
          const newHeights = dir === 'horizontal'
            ? [height, height]
            : [height * multiplier, height * (1 - multiplier) - 2 * separator]
          p.panels.forEach((panel, i) => {
            traversePanels(panel, path.concat([i]), newWidths[i], newHeights[i])
          })
          break
        }
      }
    }

    traversePanels(info.panels, [], winWidth - 2 * separator, winHeight - 2 * separator)

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
