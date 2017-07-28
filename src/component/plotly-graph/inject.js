const cst = require('./constants')

// TODO Do we really need to pass around `appOpts
// I guess passing `appOpts.debug` might be nice, but
// that might be it ...

function inject (appOpts, compOpts) {
  const parts = []

  if (compOpts.MathJax) {
    parts.push(script(compOpts.MathJax + '?config=TeX-AMS-MML_SVG'))
  }

  if (compOpts.localTopojson) {
    parts.push(script(compOpts.localTopojson))
  }

  // TODO handle logic CDN ('latest' / 'v1.23.1') / given path / require.resolve
  //
  // https://github.com/rreusser/plotly-mock-viewer#usage

  const plotlyJS = typeof compOpts.pathToPlotlyJS === 'string'
    ? compOpts.pathToPlotlyJS
    : cst.dflt.pathToPlotlyJS

  parts.push(script(plotlyJS))

  return parts.join('\n      ')
}

function script (src) {
  return `<script src="${src}"></script>`
}

module.exports = inject
