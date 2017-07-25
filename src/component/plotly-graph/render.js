/* global Plotly:false */

module.exports = function (event, info, sendToMain) {
  const gd = document.createElement('div')
  document.body.appendChild(gd)

  Plotly.newPlot(gd, info.fig)
  .then((gd) => Plotly.toImage(gd, {format: info.format}))
  .then((imgData) => {
    sendToMain({
      code: 200,
      imgData: imgData.replace(/^data:image\/\w+;base64,/, '')
    })
    Plotly.purge(gd)
    document.body.removeChild(gd)
  })
  .catch((err) => {
    sendToMain({
      code: 525,
      msg: JSON.stringify(err, ['message', 'arguments', 'type', 'name'])
    })
  })
}
