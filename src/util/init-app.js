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
  // https://github.com/electron/electron/issues/1277#issuecomment-296397800
  app.commandLine.appendSwitch('enable-gpu-rasterization')
  app.commandLine.appendSwitch('enable-zero-copy')
  app.commandLine.appendSwitch('disable-software-rasterizer')
  app.commandLine.appendSwitch('enable-native-gpu-memory-buffers')

  ipcMain.on('renderer-error', (event, info) => {
    app.emit('renderer-error', {
      code: 501,
      msg: RENDERER_ERROR_MSG,
      error: info
    })
  })

  app.on('event-gpu-process-crashed', (event, info) => {
    app.emit('renderer-error', {
      code: 501,
      msg: 'gpu process crashed',
      error: info
    })
  })
}

module.exports = initApp
