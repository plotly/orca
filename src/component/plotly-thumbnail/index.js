const plotlyGraph = require('../plotly-graph')

module.exports = {
  name: 'plotly-thumbnail',
  inject: plotlyGraph.inject,
  parse: require('./parse'),
  render: plotlyGraph.render,
  convert: plotlyGraph.convert
}
