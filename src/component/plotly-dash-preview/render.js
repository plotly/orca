const remote = require('../../util/remote')

/**
 * @param {object} info : info object
 *  - url
 * @param {object} opts : component options
 * @param {function} sendToMain
 *  - errorCode
 *  - result
 *    - imgData
 */
function render (info, opts, sendToMain) {
  const result = {}

  let win = remote.createBrowserWindow()

  const contents = win.webContents
  let errorCode = null

  const done = errorCode => {
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
      contents.printToPDF({}, (err, pdfData) => {
        if (err) {
            done(525)
        }
        else {
          result.imgData = pdfData
          done()
        }
      })
  })

  win.loadURL(info.url)
}

module.exports = render
