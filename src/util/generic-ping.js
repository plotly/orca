/** A generic ping function for modules that don't need anything special
 *
 * @param {function} sendToMain - sends the response to the main process
 */
function ping (sendToMain) {
  sendToMain()
}

module.exports = ping
