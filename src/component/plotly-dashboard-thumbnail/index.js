const plotlyGraph = require('../plotly-graph')

module.exports = {
  name: 'plotly-dashboard-thumbnail',
  ping: require('../../util/generic-ping'),
  inject: plotlyGraph.inject,
  parse: require('./parse'),
  render: require('./render'),
  convert: require('./convert')
}
