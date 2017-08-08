const fs = require('fs')
const path = require('path')

const COMPONENT_GLOBAL = 'PlotlyExporterComponent'
const PATH_TO_BUILD = path.join(__dirname, '..', '..', 'build')
const PATH_TO_INIT_RENDERERS = path.join(__dirname, 'init-renderers.js')

/** Create HTML index file
 *
 * @param {object} comp (full) component object
 *  - name
 *  - path
 *  - inject
 * @param {function} cb callback
 *  - err
 *  - pathToIndex {string}
 */
function createIndex (comp, cb) {
  const pathToIndex = path.join(PATH_TO_BUILD, `index-${comp.name}.html`)

  // make options available to render `this` object
  const bind = () => {
    return comp.availableOptions
      .map(opt => `${COMPONENT_GLOBAL}['${opt}'] = ${JSON.stringify(comp[opt])}`)
      .join('\n        ')
  }

  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>plotly image exporter - component ${comp.name}</title>
      ${comp.inject()}
    </head>
    <body>
      <script>
        ${COMPONENT_GLOBAL} = require('${comp.path}')
        ${bind()}
        require('${PATH_TO_INIT_RENDERERS}')([${COMPONENT_GLOBAL}])
      </script>
    </body>
  </html>`

  fs.writeFile(pathToIndex, html, (err) => {
    cb(err, pathToIndex)
  })
}

module.exports = createIndex
