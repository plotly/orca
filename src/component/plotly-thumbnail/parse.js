const plotlyGraphParse = require('../plotly-graph/parse')

/**
 * @param {object} body : JSON-parsed request body
 * @param {object} opts : component options
 * @param {function} sendToRenderer
 * - errorCode
 * - result
 */
function parse (body, opts, sendToRenderer) {
  plotlyGraphParse(body, opts, (errorCode, result) => {
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
