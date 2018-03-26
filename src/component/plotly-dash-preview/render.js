const remote = require('../../util/remote')

/**
 * @param {object} info : info object
 *  - url
 *  - pdfOptions
 * @param {object} opts : component options
 * @param {function} sendToMain
 *  - errorCode
 *  - result
 *    - imgData
 */
function render (info, opts, sendToMain) {
  const result = {}

  let win = remote.createBrowserWindow()
  win.loadURL(info.url)

  const contents = win.webContents

  const done = errorCode => {
    win.close()

    if (errorCode) {
      result.msg = 'dash preview generation failed'
    }
    sendToMain(errorCode, result)
  }

  /*
   * We check for a 'waitfor' div in the dash-app
   * which indicates that the app has finished rendering.
   */
  const finishedLoading = () => {
    return win.webContents.executeJavaScript(`
      new Promise((resolve, reject) => {
        var a = document.getElementById("waitfor");
        if (a) {
          resolve(true);
        }
      })`)
  }

  win.on('closed', () => {
    win = null
  })

  let intervalId = setInterval(() => {
    finishedLoading().then(loaded => {
      if (loaded) {
        clearInterval(intervalId)
        contents.printToPDF(info.pdfOptions, (err, pdfData) => {
          if (err) {
            done(525)
          } else {
            result.imgData = pdfData
            done()
          }
        })
      }
    })
  }, 500)
}

module.exports = render
