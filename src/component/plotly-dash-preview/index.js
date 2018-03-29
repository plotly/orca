module.exports = {
  name: 'plotly-dash-preview',
  ping: require('../../util/generic-ping'),
  // inject is not required here, but omitting it causes test-failures
  inject: require('./../plotly-graph/inject'),
  parse: require('./parse'),
  render: require('./render'),
  convert: require('./convert')
}
