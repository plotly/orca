const remote = require('../../util/remote')
const cst = require('./constants')

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

  let createBrowserWindowOpts = info.browserSize ? info.browserSize : {}
  createBrowserWindowOpts['enableLargerThanScreen'] = true
  createBrowserWindowOpts['useContentSize'] = true
  createBrowserWindowOpts['show'] = opts.debug

  let win = remote.createBrowserWindow(createBrowserWindowOpts)
  const contents = win.webContents
  const session = contents.session

  const done = errorCode => {
    win.close()

    if (errorCode) {
      result.msg = cst.statusMsg[errorCode]
    }
    sendToMain(errorCode, result)
  }

  /*
   * We check for a 'waitfor' div in the dash-app
   * which indicates that the app has finished rendering.
   */
  const loaded = () => {
    return win.webContents.executeJavaScript(`
      new Promise((resolve, reject) => {
        let tries = ${info.tries} || ${cst.maxRenderingTries}

        let interval = setInterval(() => {
          let el = document.querySelector('${info.selector}')

          if (el) {
            clearInterval(interval)
            resolve(true)
          }

          if (--tries === 0) {
            clearInterval(interval)

            if (${info.timeOut}) {
              resolve(true)
            } else {
              reject('fail to load')
            }
          }
        }, ${cst.minInterval})

      })`)
  }

  win.on('closed', () => {
    win = null
  })

  // Clear cookies before loading URL
  session.clearStorageData({})
    .then(() => win.loadURL(info.url))
    .then(() => loaded())
    .catch(() => {
      done(526) // timeout
    })
    .then(() => {
      // Move mouse outside the page to prevent hovering on figures
      contents.sendInputEvent({ type: 'mouseMove', x: -1, y: -1 })

      // Close window if timeout is exceeded
      // This is necessary because `printToPDF` sometimes never end
      // https://github.com/electron/electron/issues/20634
      if (info.timeOut) {
        setTimeout(() => done(526), info.timeOut * 1000)
      }
      return contents.printToPDF(info.pdfOptions)
    })
    .then(pdfData => {
      result.imgData = pdfData
      done() // success
    })
    .catch(e => {
      done(525) // generation failed
    })
}

module.exports = render
