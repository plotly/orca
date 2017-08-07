module.exports = {
  name: 'plotly-graph',
  availableOptions: [
    'plotlyJS', 'mathjax', 'topojson',
    'format', 'scale', 'width', 'height'
  ],
  inject: require('./inject'),
  parse: require('./parse'),
  render: require('./render'),
  convert: require('./convert')
}
