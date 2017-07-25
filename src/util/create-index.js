const fs = require('fs')
const path = require('path')
const browserify = require('browserify')
const str = require('string-to-stream')

const COMPONENT_GLOBAL = 'PlotlyExporterComponents'

/** Create HTML index file
 *
 * @param {object} opts (full) option object
 *  - ...
 *
 */
function createIndex (opts, cb) {
  const pathToBuild = path.join(__dirname, '..', '..', 'build')
  const pathToIndex = path.join(pathToBuild, 'index.html')
  const pathToRenderBundle = path.join(pathToBuild, 'render-bundle.js')
  const pathToInitRenderers = path.join(__dirname, 'init-renderers.js')

  const scripts = () => {
    return `<script src="https://cdn.plot.ly/plotly-latest.js"></script>`
  }

  var html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>plotly.js image exporter</title>
      ${scripts()}
    </head>
    <body>
      <script src=${pathToRenderBundle}></script>
      <script>
        const initRenderers = require('${pathToInitRenderers}')
        initRenderers(${COMPONENT_GLOBAL})
      </script>
    </body>
  </html>`

  const js = `
    module.exports = {
      'plotly-graph': require('../component/plotly-graph')
    }`

  fs.writeFile(pathToIndex, html, (err) => {
    if (err) throw err

    browserify(str(js), {
      basedir: __dirname,
      standalone: COMPONENT_GLOBAL,
      debug: opts.debug
    })
    .bundle()
    .pipe(fs.createWriteStream(pathToRenderBundle))
    .on('finish', () => cb(pathToIndex))
  })
}

module.exports = createIndex
