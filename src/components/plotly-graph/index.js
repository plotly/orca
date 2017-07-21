const path = require('path')

module.exports = {
  name: 'plotly-graph',
  injectScripts: (opts) => {
    return opts
  },
  render: require('./render'),
  convert: require('./convert')
}
