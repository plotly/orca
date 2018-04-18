/** Small (common) wrapper for electron app that:
 *  - adds command line flag to make WebGL work in headless envs
 *  - registers renderer-error ipc listener
 *  - handle gpu process crashed events
 *
 * @param {electron app} app
 * @param {ipcMain} ipcMain
 */
function initApp (app, ipcMain) {
  app.commandLine.appendSwitch('ignore-gpu-blacklist')

  ipcMain.on('renderer-error', (event, info) => {
    app.emit('renderer-error', {
      code: 501,
      msg: 'renderer error',
      error: info
    })
  })

  app.on('gpu-process-crashed', (event, info) => {
    app.emit('renderer-error', {
      code: 501,
      msg: 'gpu process crashed',
      error: info
    })
  })
}

module.exports = initApp
