/* global Plotly:false */

module.exports = function (info, opts, sendToMain) {
  const gd = document.createElement('div')
  document.body.appendChild(gd)

  const destroy = () => {
    Plotly.purge(gd)
    document.body.removeChild(gd)
  }

  Plotly.newPlot(gd, info.figure)
  .then(() => Plotly.toImage(gd, {format: info.format}))
  .then((imgData) => {
    sendToMain(null, {
      format: info.format,
      imgData: imgData.replace(/^data:image\/\w+;base64,/, '')
    })
    destroy()
  })
  .catch((err) => {
    sendToMain(525, JSON.stringify(err, ['message', 'arguments', 'type', 'name']))
    destroy()
  })
}
