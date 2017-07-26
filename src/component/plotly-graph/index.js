module.exports = {
  name: 'plotly-graph',
  injectScripts: (opts) => {
    return opts
  },
  parse: require('./parse'),
  render: require('./render'),
  convert: require('./convert')
}
