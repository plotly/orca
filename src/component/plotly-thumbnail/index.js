module.exports = {
  name: 'plotly-thumbnail',
  inject: require('../plotly-graph/inject'),
  parse: require('./parse'),
  render: require('../plotly-graph/render'),
  convert: require('../plotly-graph/convert')
}
