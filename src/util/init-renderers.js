const {ipcRenderer} = require('electron')

function initRenderers (components) {
  components.forEach((comp) => {
    ipcRenderer.on(comp.name, (event, id, info, opts) => {
      const sendToMain = (errorCode, info) => {
        ipcRenderer.send(id, errorCode, info)
      }

      comp.render(info, opts, sendToMain)
    })
  })
}

// send errors to main process
window.onerror = (err) => {
  ipcRenderer.send('renderer-error', err)
}

module.exports = initRenderers
