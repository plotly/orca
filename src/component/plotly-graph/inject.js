const fs = require('fs')
const path = require('path')
const isUrl = require('is-url')
const semver = require('semver')
const isNonEmptyString = require('../../util/is-non-empty-string')
const cst = require('./constants')

/** plotly-graph inject
 *
 * @param {object} opts : component options
 *  - plotlyJS
 *  - mathjax
 *  - topojson
 * @return {array}
 */
function inject (opts = {}) {
  const plotlyJS = opts.plotlyJS
  const mathjax = opts.mathjax
  const topojson = opts.topojson
  const parts = []

  if (isNonEmptyString(mathjax)) {
    let src = resolve(mathjax)
    if (src) {
      parts.push(script(src + cst.mathJaxConfigQuery))
    } else {
      throw new Error('Provided path to MathJax files does not exists')
    }
  }

  if (isNonEmptyString(topojson)) {
    let src = resolve(topojson)
    if (src) {
      parts.push(script(src))
    } else {
      throw new Error('Provided path to topojson files does not exists')
    }
  }

  if (isNonEmptyString(plotlyJS)) {
    let src = resolve(plotlyJS)
    if (src) {
      parts.push(script(src))
    } else if (plotlyJS === 'latest' || semver.valid(plotlyJS)) {
      parts.push(script(cdnSrc(plotlyJS)))
    } else {
      throw new Error('Provided path to plotly.js bundle does not exist and does not correspond to a release version')
    }
  } else {
    parts.push(script(cdnSrc('latest')))
  }

  return parts
}

function resolve (v) {
  if (isUrl(v)) {
    return v
  } else {
    const p = path.resolve(v)
    return fs.existsSync(p) ? p : false
  }
}

function script (src) {
  return `<script src="${src}"></script>`
}

function cdnSrc (v) {
  v = v.charAt(0) === 'v' ? v.slice(1) : v
  return `https://cdn.plot.ly/plotly-${v}.min.js`
}

module.exports = inject
