module.exports = {
  name: 'plotly-graph',
  availableOptions: [
    'plotlyJS', 'mapboxAccessToken', 'mathjax', 'topojson',
    'format', 'scale', 'width', 'height'
  ],
  inject: require('./inject'),
  parse: require('./parse'),
  render: require('./render'),
  convert: require('./convert')
}
