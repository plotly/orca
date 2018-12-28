const { app, BrowserWindow } = require('electron')
const { ipcMain } = require('electron')

const initApp = require('../../util/init-app')
const createIndex = require('../../util/create-index')
const coerceOpts = require('./coerce-opts')
const run = require('./run')

/** Create runner app
 *
 * @param {object} _opts
 *   - input {string or array of strings}
 *   - debug {boolean} turn on debugging tooling
 *   - component {string, object, array of a strings or array of objects}
 *     - name {string}
 *     - path {string}
 *     - ... other options to be passed to methods
 *
 * @return {object} app
 */
function createApp (_opts) {
  initApp(app, ipcMain)

  const opts = coerceOpts(_opts)
  let win = null
  let index = null

  app.on('ready', () => {
    win = new BrowserWindow(opts._browserWindowOpts)

    if (opts.debug) {
      win.openDevTools()
    }

    win.on('closed', () => {
      win = null
      index.destroy()
    })

    createIndex(opts.component, opts, (_index) => {
      index = _index
      win.loadURL(`file://${index.path}`)
    })

    win.webContents.once('did-finish-load', () => {
      run(app, win, ipcMain, opts)
    })
  })

  return app
}

module.exports = createApp
