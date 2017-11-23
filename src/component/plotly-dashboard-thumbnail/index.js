const plotlyGraph = require('../plotly-graph')

module.exports = {
  name: 'plotly-dashboard-thumbnail',
  inject: plotlyGraph.inject,
  parse: require('./parse'),
  render: require('./render'),
  convert: require('./convert')
}
