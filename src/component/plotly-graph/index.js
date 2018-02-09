module.exports = {
  name: 'plotly-graph',
  ping: require('../../util/generic-ping'),
  inject: require('./inject'),
  parse: require('./parse'),
  render: require('./render'),
  convert: require('./convert')
}
