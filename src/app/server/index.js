const { app, BrowserWindow } = require('electron')
const { ipcMain } = require('electron')
// require('electron-debug')({showDevTools: true})

const initApp = require('../../util/init-app')
const createIndex = require('../../util/create-index')
const createTimer = require('../../util/create-timer')
const coerceOpts = require('./coerce-opts')
const createServer = require('./create-server')

/** Create server app
 *
 * @param {object} _opts
 *   - port {number} port number
 *   - debug {boolean} turn on debugging tooling
 *   - component {string, object}
 *     - name {string}
 *     - path {string}
 *     - ... other options to be passed to methods
 *
 * @return {object} app
 */
function createApp (_opts) {
  initApp(app, ipcMain)

  const opts = coerceOpts(_opts)
  const components = opts.component
  const server = createServer(app, BrowserWindow, ipcMain, opts)

  let timer = createTimer()
  let numberOfWindowstYetToBeLoaded = components.length

  app.on('ready', () => {
    components.forEach((comp) => {
      let win = new BrowserWindow(opts._browserWindowOpts)
      comp._win = win

      if (opts.debug) {
        win.openDevTools()
      }

      win.on('closed', () => {
        win = null
      })

      createIndex(comp, opts, (index) => {
        comp._index = index
        win.loadURL(`file://${index.path}`)
      })

      win.webContents.once('did-finish-load', () => {
        if (--numberOfWindowstYetToBeLoaded === 0) {
          server.listen(opts.port, () => {
            app.emit('after-connect', {
              port: opts.port,
              startupTime: timer.end(),
              openRoutes: components.map((comp) => comp.route)
            })
          })
        }
      })
    })
  })

  process.on('exit', () => {
    server.close()
    components.forEach((comp) => comp._index.destroy())
  })

  return app
}

module.exports = createApp
