/* global Plotly:false */

const cst = require('./constants')
const semver = require('semver')

/**
 * @param {object} info : info object
 *  - figure
 *  - format
 *  - width
 *  - height
 *  - scale
 * @param {object} opts : component options
 *  - mapboxAccessToken
 * @param {function} sendToMain
 *  - errorCode
 *  - result
 *    - imgData
 */
function render (info, opts, sendToMain) {
  const figure = info.figure
  const format = info.format

  const config = Object.assign({},
    {mapboxAccessToken: opts.mapboxAccessToken || ''},
    figure.config
  )

  const result = {}
  let errorCode = null

  const done = () => {
    if (errorCode) {
      result.msg = cst.statusMsg[errorCode]
    }
    sendToMain(errorCode, result)
  }

  // TODO
  // - figure out if we still need this:
  //   https://github.com/plotly/streambed/blob/7311d4386d80d45999797e87992f43fb6ecf48a1/image_server/server_app/main.js#L224-L229
  // - increase pixel ratio images (scale up here, scale down in convert) ??
  // - handle thumbnails here? or in a separate component?
  // - does webp (via batik) support transparency now?

  const imgOpts = {
    format: (format === 'pdf' || format === 'eps') ? 'svg' : format,
    width: info.scale * info.width,
    height: info.scale * info.height,
    // return image data w/o the leading 'data:image' spec
    imageDataOnly: true,
    // blend jpeg background color as jpeg does not support transparency
    setBackground: format === 'jpeg' ? 'opaque' : ''
  }

  let promise

  if (semver.gte(Plotly.version, '1.30.0')) {
    promise = Plotly.toImage({
      data: figure.data,
      layout: figure.layout,
      config: config
    }, imgOpts)
  } else if (semver.gte(Plotly.version, '1.11.0')) {
    const gd = document.createElement('div')

    promise = Plotly
      .newPlot(gd, figure.data, figure.layout, config)
      .then(() => Plotly.toImage(gd, imgOpts))
      .then((imgData) => {
        Plotly.purge(gd)

        switch (imgOpts.format) {
          case 'png':
          case 'jpeg':
          case 'webp':
            return imgData.replace(cst.imgPrefix.base64, '')
          case 'svg':
            return decodeURIComponent(imgData.replace(cst.imgPrefix.svg, ''))
        }
      })
  } else {
    errorCode = 526
    result.error = `plotly.js version: ${Plotly.version}`
    return done()
  }

  promise.then((imgData) => {
    result.imgData = imgData
    return done()
  })
  .catch((err) => {
    errorCode = 525
    result.error = JSON.stringify(err, ['message', 'arguments', 'type', 'name'])
    return done()
  })
}

module.exports = render
