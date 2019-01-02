const { ipcRenderer } = require('electron')

/** Small wrapper that registers ipc listeners for all components
 *  on channels given by their component name.
 *
 * @param {array of objects} components
 *   - name {string}
 *   - render {function}
 */
function initRenderers (components) {
  components.forEach((_module) => {
    ipcRenderer.on(_module.name, (event, id, info, opts) => {
      const sendToMain = (errorCode, info) => {
        ipcRenderer.send(id, errorCode, info)
      }

      _module.render(info, opts, sendToMain)
    })
  })
}

// send errors to main process
window.onerror = (err) => {
  ipcRenderer.send('renderer-error', err)
}

module.exports = initRenderers
