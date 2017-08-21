const IFRAME_LOAD_TIMEOUT = 5000

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
function render (info, opts, sendToMain) {
  // Cannot require 'remote' in the module scope
  // as this file gets required in main process first
  // during the coerce-component step
  //
  // TODO
  // - maybe require this in <html> from create-index,
  //   so that we don't have to worry about requiring it
  //   inside the function body AND to make mockable for testing
  const {BrowserWindow} = require('electron').remote

  let win = new BrowserWindow({
    width: info.width,
    height: info.height
  })

  const result = {}
  let contents = win.webContents

  const done = () => {
    win.close()
  }

  win.on('closed', () => {
    win = null
  })

  // ... or plain index.html + `win.executeJavascript`
  win.loadURL(info.url)

  // TODO
  // - find better solution than IFRAME_LOAD_TIMEOUT
  // - but really, we shouldn't be using iframes in embed view?
  // - use `content.capturePage` to render PNGs and JPEGs
  // - or use batik?

  contents.once('did-finish-load', () => {
    setTimeout(() => {
      contents.printToPDF({}, (err, imgData) => {
        if (err) {
          result.msg = 'print to PDF error'
          sendToMain(525, result)
          return done()
        }

        result.imgData = imgData
        sendToMain(null, result)
        done()
      })
    }, IFRAME_LOAD_TIMEOUT)
  })
}

module.exports = render
