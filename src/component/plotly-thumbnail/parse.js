const plotlyGraphParse = require('../plotly-graph/parse')
const isPlainObj = require('is-plain-obj')

const counter = '([2-9]|[1-9][0-9]+)?$'
const axNameRegex = new RegExp('^[xy]axis' + counter)
const axIdRegex = new RegExp('^[xy]' + counter)
const sceneRegex = new RegExp('^scene' + counter)

/**
 * @param {object} body : JSON-parsed request body
 * @param {object} opts : component options
 * @param {function} sendToRenderer
 * - errorCode
 * - result
 */
function parse (body, opts, sendToRenderer) {
  plotlyGraphParse(body, opts, (errorCode, result) => {
    result.format = 'png'
    overrideFigure(result.figure)
    sendToRenderer(errorCode, result)
  })
}

function overrideFigure (figure) {
  const data = figure.data
  const layout = figure.layout

  // remove title, margins and legend
  layout.title = ''
  layout.margin = { t: 0, b: 0, l: 0, r: 0 }
  layout.showlegend = false

  // remove all annotations
  delete layout.annotations

  // remove color bars and pie labels
  data.forEach(trace => {
    trace.showscale = false
    if (isPlainObj(trace.marker)) trace.marker.showscale = false
    if (trace.type === 'pie') trace.textposition = 'none'
  })

  // remove title in base 2d axes
  overrideAxis(layout, 'xaxis')
  overrideAxis(layout, 'yaxis')

  // remove title in base 3d axes
  overrideScene(layout, 'scene')

  // look for other axes in layout
  for (var k in layout) {
    if (axNameRegex.test(k)) {
      overrideAxis(layout, k)
    }
    if (sceneRegex.test(k)) {
      overrideScene(layout, k)
    }
  }

  // look for traces linked to other 2d/3d axes
  data.forEach(trace => {
    if (axIdRegex.test(trace.xaxis)) {
      overrideAxis(layout, id2name(trace.xaxis))
    }
    if (axIdRegex.test(trace.yaxis)) {
      overrideAxis(layout, id2name(trace.yaxis))
    }
    if (sceneRegex.test(trace.scene)) {
      overrideScene(layout, trace.scene)
    }
  })
}

function overrideAxis (container, axKey) {
  if (!isPlainObj(container[axKey])) {
    container[axKey] = {}
  }

  container[axKey].title = ''
}

function overrideScene (container, sceneKey) {
  if (!isPlainObj(container[sceneKey])) {
    container[sceneKey] = {}
  }

  var scene = container[sceneKey]
  var axKeys = ['xaxis', 'yaxis', 'zaxis']

  axKeys.forEach(k => {
    if (!isPlainObj(scene[k])) {
      scene[k] = {}
    }

    scene[k].title = ''
    scene[k].showaxeslabels = false
    scene[k].showticklabels = false
  })
}

function id2name (id) {
  return id.charAt(0) + 'axis' + id.substr(1)
}

module.exports = {
  parse: parse,
  overrideFigure: overrideFigure
}
