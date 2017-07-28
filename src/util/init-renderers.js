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

module.exports = initRenderers
