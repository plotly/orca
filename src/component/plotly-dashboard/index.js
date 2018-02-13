module.exports = {
  name: 'plotly-dashboard',
  ping: require('../../util/generic-ping'),
  parse: require('./parse'),
  render: require('./render'),
  convert: require('./convert')
}
