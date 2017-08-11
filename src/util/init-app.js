const RENDERER_ERROR_MSG = 'renderer error'

/** Small (common) wrapper for electron app that:
 *  - registers renderer-error ipc listener
 *  - adds command line flag to make WebGL work in headless envs
 *
 * @param {electron app} app
 * @param {ipcMain} ipcMain
 */
function initApp (app, ipcMain) {
  app.commandLine.appendSwitch('ignore-gpu-blacklist')

  ipcMain.on('renderer-error', (event, info) => {
    app.emit('renderer-error', {
      code: 501,
      msg: RENDERER_ERROR_MSG,
      error: info
    })
  })
}

module.exports = initApp
