const remote = require('../../util/remote')
const cst = require('./constants')

/**
 * @param {object} info : info object
 *  - url
 *  - width
 *  - height
 * @param {object} opts : component options
 * @param {function} sendToMain
 *  - errorCode
 *  - result
 *    - imgData
 */
function render (info, opts = {}, sendToMain) {
  let win = remote.createBrowserWindow({
    width: info.width,
    height: info.height,
    show: !!opts.debug
  })

  const contents = win.webContents
  const result = {}
  let errorCode = null

  const done = () => {
    win.close()

    if (errorCode) {
      result.msg = cst.statusMsg[errorCode]
    }
    sendToMain(errorCode, result)
  }

  win.on('closed', () => {
    win = null
  })

  // TODO
  // - find better solution than IFRAME_LOAD_TIMEOUT
  // - but really, we shouldn't be using iframes in embed view?
  // - use `content.capturePage` to render PNGs and JPEGs

  contents.once('did-finish-load', () => {
    setTimeout(() => {
      contents.printToPDF({}, (err, imgData) => {
        if (err) {
          errorCode = 525
          return done()
        }

        result.imgData = imgData
        return done()
      })
    }, cst.iframeLoadDelay)
  })

  win.loadURL(info.url)
}

module.exports = render
