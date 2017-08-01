/**
 * @param {object} opts
 *  - pathToPlotlyJS {string}
 *  - MathJax
 *  - localTopojson
 * @return {string}
 */
function inject (opts) {
  const parts = []

  if (opts.MathJax) {
    parts.push(script(opts.MathJax + '?config=TeX-AMS-MML_SVG'))
  }

  if (opts.localTopojson) {
    parts.push(script(opts.localTopojson))
  }

  // TODO
  // - handle logic CDN ('latest' / 'v1.23.1') / given path / require.resolve
  // - on par with: https://github.com/rreusser/plotly-mock-viewer#usage

  const plotlyJS = typeof opts.pathToPlotlyJS === 'string'
    ? opts.pathToPlotlyJS
    : 'https://cdn.plot.ly/plotly-latest.min.js'

  parts.push(script(plotlyJS))

  return parts.join('\n      ')
}

function script (src) {
  return `<script src="${src}"></script>`
}

module.exports = inject
