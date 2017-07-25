module.exports = {
  name: 'plotly-graph',
  injectScripts: (opts) => {
    return opts
  },
  parse: parse,
  render: require('./render'),
  convert: require('./convert')
}

// do I really need this?
function parse (body, opts, sendToRenderer) {
  sendToRenderer({
    fig: JSON.parse(body),
    format: opts.format
  })
}
