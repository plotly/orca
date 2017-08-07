/* global Plotly:false */

const cst = require('./constants')

/**
 * @param {object} info
 *  - figure
 *  - format
 *  - width
 *  - height
 *  - scale
 * @param {function} sendToMain
 *  - errorCode
 *  - result
 *    - imgData
 */
function render (info, sendToMain) {
  const figure = info.figure
  const format = info.format

  const config = Object.assign({},
    {mapboxAccessToken: this.mapboxAccessToken},
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

  Plotly.toImage({
    data: figure.data,
    layout: figure.layout,
    config: config
  }, {
    format: format,
    width: info.scale * info.width,
    height: info.scale * info.height,
    // return image data w/o the leading 'data:image' spec
    imageDataOnly: true,
    // blend jpeg background color as jpeg does not support transparency
    setBackground: format === 'jpeg' ? 'blend' : ''
  })
  .then((imgData) => {
    result.imgData = imgData
    done()
  })
  .catch((err) => {
    errorCode = 525
    result.error = JSON.stringify(err, ['message', 'arguments', 'type', 'name'])
    done()
  })
}

module.exports = render
