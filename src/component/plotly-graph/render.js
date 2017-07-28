/* global Plotly:false */

const cst = require('./constants')

module.exports = function (info, opts, sendToMain) {
  const config = Object.assign({}, cst.plotConfig, {mapboxAccessToken: opts.mapboxAccessToken})
  const figure = Object.assign({}, {config: config}, info.figure)

  const gd = document.createElement('div')
  document.body.appendChild(gd)

  const result = {}
  let errorCode = null

  const done = () => {
    Plotly.purge(gd)
    document.body.removeChild(gd)

    if (errorCode) {
      result.msg = cst.statusMsg[errorCode]
    }

    sendToMain(errorCode, result)
  }

  Plotly.newPlot(gd, figure)
  .then(() => Plotly.toImage(gd, {format: info.format}))
  .then((imgData) => {
    result.imgData = imgData.replace(/^data:image\/\w+;base64,/, '')
    done()
  })
  .catch((err) => {
    errorCode = 525
    result.error = JSON.stringify(err, ['message', 'arguments', 'type', 'name'])
    done()
  })
}
