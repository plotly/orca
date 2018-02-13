const uuid = require('uuid/v4')

/** Ping all components then resolve.  If any component hangs, so will
 *  this promise.
 *
 * @param {ipcMain} Electron ipcMain
 * @param {Array} components - list of components to ping
 */
const Ping = (ipcMain, components) => new Promise((resolve, reject) => {
  function runPing () {
    let pendingPings = components.length

    components.forEach((comp) => {
      const id = uuid()
      const channel = comp.name + '-ping'

      ipcMain.once(id, (event) => {
        if (--pendingPings <= 0) {
          resolve()
        }
      })

      comp._win.webContents.send(channel, id)
    })
  }

  runPing()
})

module.exports = Ping
