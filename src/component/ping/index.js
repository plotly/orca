const plotlyGraph = require('../plotly-graph')

module.exports = {
  name: 'ping',
  inject: plotlyGraph.inject,
  parse: plotlyGraph.parse,
  //render: plotlyGraph.render,
  render: require('./render'),
  convert: plotlyGraph.convert
  //convert: require('./convert')
}
