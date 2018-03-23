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
  win.loadURL(info.url)

  const contents = win.webContents
  let errorCode = null

  const done = errorCode => {
    win.close()

    if (errorCode) {
      result.msg = 'dash preview generation failed'
    }
    sendToMain(errorCode, result)
  }

  const finishedLoading = () => {
    return win.webContents.executeJavaScript(`
      new Promise((resolve, reject) => {
        var a = document.getElementById("_finished_loading");
        if (a) {
          resolve(a.offsetTop);
        }
      })`).then(height => {
        if (height > 50) {
          return true;
        } else {
          return false
        }
      })
  }

  win.on('closed', () => {
    win = null
  })

  let intervalId = setInterval(() => {
    finishedLoading().then(loaded => {
        if (loaded) {
          clearInterval(intervalId);
          contents.printToPDF({}, (err, pdfData) => {
            if (err) {
                done(525)
            }
            else {
              result.imgData = pdfData
              done()
            }
          })        
        }
    })}, 500)

}

module.exports = render
