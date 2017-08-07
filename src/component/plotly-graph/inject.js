const cst = require('./constants')
const fs = require('fs')
const semverRegex = require('semver-regex')

/** plotly-graph inject
 *
 * @return {string}
 */
function inject () {
  const plotlyJS = this.plotlyJS
  const mathjax = this.mathjax
  const topojson = this.topojson
  const parts = []

  if (mathjax) {
    if (fs.existsSync(mathjax)) {
      parts.push(script(mathjax + cst.mathJaxConfigQuery))
    } else {
      throw new Error('Provided path to MathJax files does not exists')
    }
  }

  if (topojson) {
    if (fs.existsSync(topojson)) {
      parts.push(script(topojson))
    } else {
      throw new Error('Provided path to topojson files does not exists')
    }
  }

  if (plotlyJS) {
    if (fs.existsSync(plotlyJS)) {
      parts.push(script(plotlyJS))
    } else if (plotlyJS === 'latest' || semverRegex.test(plotlyJS)) {
      parts.push(script(cdnSrc(plotlyJS)))
    } else {
      throw new Error('Provided path to plotly.js bundle does not exist and does not correspond to a release version')
    }
  } else {
    parts.push(script(cdnSrc('latest')))
  }

  return parts.join('\n      ')
}

function script (src) {
  return `<script src="${src}"></script>`
}

function cdnSrc (v) {
  v = v.charAt(0) === 'v' ? v.slice(1) : v
  return `https://cdn.plot.ly/plotly-${v}.min.js`
}

module.exports = inject
