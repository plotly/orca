const { ipcRenderer } = require('electron')

/** Small wrapper that registers ipc listeners for all components
 *  on channels based on the component name.
 *
 * @param {array of objects} components
 *   - name {string}
 *   - ping {function}
 */
function initPings (components) {
  components.forEach((_module) => {
    ipcRenderer.on(_module.name + '-ping', (event, id) => {
      const sendToMain = () => {
        ipcRenderer.send(id)
      }

      _module.ping(sendToMain)
    })
  })
}

module.exports = initPings
