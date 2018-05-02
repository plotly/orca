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
  createBrowserWindowOpts['show'] = opts.debug

  let win = remote.createBrowserWindow(createBrowserWindowOpts)
  const contents = win.webContents
  const session = contents.session

  // Clear cookies before loading URL
  session.clearStorageData({}, () => {
    win.loadURL(info.url)
  })

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

  loaded().then(() => {
    contents.printToPDF(info.pdfOptions, (err, pdfData) => {
      if (err) {
        done(525)
      } else {
        result.imgData = pdfData
        done()
      }
    })
  }).catch(() => {
    done(526)
  })
}

module.exports = render
