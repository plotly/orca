/* Small wrapper around the renderer process 'remote' module, to
 * easily mock it using sinon in test/common.js
 *
 * More info on the remote module:
 * - https://electron.atom.io/docs/api/remote/
 */

function load () {
  return require('electron').remote
}

module.exports = {
  createBrowserWindow: (opts) => {
    const _module = load()
    opts['skipTaskbar'] = true
    return new _module.BrowserWindow(opts)
  },
  getCurrentWindow: () => load().getCurrentWindow()
}
