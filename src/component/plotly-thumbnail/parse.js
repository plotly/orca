const plotlyGraphParse = require('../plotly-graph/parse')

/**
 * @param {object} body (passed to plotly-graph/parse.js)
 * @param {function} sendToRenderer
 * - errorCode
 * - result
 */
function parse (body, sendToRenderer) {
  plotlyGraphParse(body, (errorCode, result) => {
    result.format = 'png'
    overrideFigure(result.figure)
    sendToRenderer(errorCode, result)
  })
}

function overrideFigure (figure) {
  const layout = figure.layout

  layout.title = ''
  layout.margin = {t: 0, b: 0, l: 0, r: 0}

  // ... as in snapshot/cloneplot.js
}

module.exports = parse
