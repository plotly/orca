const plotlyGraph = require('../plotly-graph')

module.exports = {
  name: 'plotly-thumbnail',
  ping: require('../../util/generic-ping'),
  inject: plotlyGraph.inject,
  parse: require('./parse').parse,
  render: plotlyGraph.render,
  convert: plotlyGraph.convert
}
