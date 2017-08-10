const fs = require('fs')
const isUrl = require('is-url')
const semverRegex = require('semver-regex')
const cst = require('./constants')

/** plotly-graph inject
 *
 * @param {object} opts : component options
 *  - plotlyJS
 *  - mathjax
 *  - topojson
 * @return {array}
 */
function inject (opts) {
  opts = opts || {}

  const plotlyJS = opts.plotlyJS
  const mathjax = opts.mathjax
  const topojson = opts.topojson
  const parts = []

  if (mathjax) {
    if (fs.existsSync(mathjax) || isUrl(mathjax)) {
      parts.push(script(mathjax + cst.mathJaxConfigQuery))
    } else {
      throw new Error('Provided path to MathJax files does not exists')
    }
  }

  if (topojson) {
    if (fs.existsSync(topojson) || isUrl(topojson)) {
      parts.push(script(topojson))
    } else {
      throw new Error('Provided path to topojson files does not exists')
    }
  }

  if (plotlyJS) {
    if (fs.existsSync(plotlyJS) || isUrl(plotlyJS)) {
      parts.push(script(plotlyJS))
    } else if (plotlyJS === 'latest' || semverRegex().test(plotlyJS)) {
      parts.push(script(cdnSrc(plotlyJS)))
    } else {
      throw new Error('Provided path to plotly.js bundle does not exist and does not correspond to a release version')
    }
  } else {
    parts.push(script(cdnSrc('latest')))
  }

  return parts
}

function script (src) {
  return `<script src="${src}"></script>`
}

function cdnSrc (v) {
  v = v.charAt(0) === 'v' ? v.slice(1) : v
  return `https://cdn.plot.ly/plotly-${v}.min.js`
}

module.exports = inject
