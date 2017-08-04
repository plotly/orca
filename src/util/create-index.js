const fs = require('fs')
const path = require('path')

const COMPONENT_GLOBAL = 'PlotlyExporterComponents'
const PATH_TO_BUILD = path.join(__dirname, '..', '..', 'build')
const PATH_TO_INIT_RENDERERS = path.join(__dirname, 'init-renderers.js')

/** Create HTML index file
 *
 * @param {object} opts (full) option object
 *  - component {object or array of objects}
 * @param {function} cb callback
 *  - pathToIndex {string}
 */
function createIndex (opts, cb) {
  const pathToIndex = path.join(PATH_TO_BUILD, 'index.html')
  const components = Array.isArray(opts.component) ? opts.component : [opts.component]

  // TODO maybe each component should have its own window?
  const didInject = []

  const head = () => {
    const parts = []

    components.forEach((comp) => {
      const inject = comp.inject

      if (didInject.indexOf(inject) === -1) {
        parts.push(inject(comp.options))
        didInject.push(inject)
      }
    })

    return parts.join('\n')
  }

  const js = () => {
    const parts = components.map((comp) => `require('${comp.path}')`)
    return `${COMPONENT_GLOBAL} = [${parts.join(',')}]`
  }

  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>plotly image exporter</title>
      ${head()}
    </head>
    <body>
      <script>
        ${js()}
        require('${PATH_TO_INIT_RENDERERS}')(${COMPONENT_GLOBAL})
      </script>
    </body>
  </html>`

  fs.writeFile(pathToIndex, html, (err) => {
    if (err) throw err
    cb(pathToIndex)
  })
}

module.exports = createIndex
