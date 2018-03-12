const remote = require('../../util/remote')

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
  const PRINT_TO_PDF = (info.format === 'pdf')
  const result = {}

  let win = remote.createBrowserWindow({
    width: info.width,
    height: info.height
  })

  const contents = win.webContents
  let errorCode = null

  const done = () => {
    win.close()

    if (errorCode) {
      result.msg = 'dash preview generation failed'
    }
    sendToMain(errorCode, result)
  }

  win.on('closed', () => {
    win = null
  })

  contents.on('page-favicon-updated', () => {
    if (PRINT_TO_PDF) {
      contents.printToPDF({}, (err, pdfData) => {
        result.imgData = pdfData
        done()
      })
    } else {
      contents.capturePage(img => {
        result.imgData = img.toPNG()
        done()
      })
    }
  })

  win.loadURL(info.url)
}

module.exports = render
