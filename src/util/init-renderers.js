const {ipcRenderer} = require('electron')

function initRenderers (components) {
  Object.keys(components).forEach((k) => {
    const comp = components[k]

    ipcRenderer.on(comp.name, (event, id, info) => {
      const sendToMain = (info) => {
        ipcRenderer.send(id, info)
      }

      comp.render(event, info, sendToMain)
    })
  })
}

module.exports = initRenderers
