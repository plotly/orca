const fs = require('fs')
const path = require('path')
const uuid = require('uuid/v4')
const isNonEmptyString = require('./is-non-empty-string')

const COMPONENT_GLOBAL = 'PlotlyExporterComponent'
const PATH_TO_BUILD = path.join(__dirname, '..', '..', 'build')
const PATH_TO_INIT_RENDERERS = path.join(__dirname, 'init-renderers.js')

/** Create HTML index file
 *
 * @param {object} comp : (full) component object
 *  - name
 *  - path
 *  - options
 *  - _method.inject
 * @param {object} opts : app options
 *  - debug
 * @param {function} cb callback
 *  - err
 *  - index {object}
 *    - path {string}
 *    - destroy {function}
 */
function createIndex (comp, opts, cb) {
  opts = opts || {}

  const debug = opts.debug
  const uid = uuid()
  const pathToIndex = path.join(PATH_TO_BUILD, `index-${uid}.html`)

  const inject = () => {
    const parts = comp._module.inject(comp.options)

    if (isNonEmptyString(parts)) {
      return parts
    } else if (Array.isArray(parts)) {
      return parts.join('\n      ')
    } else {
      return ''
    }
  }

  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>plotly image exporter - component ${comp.name} (${uid})</title>
      ${inject()}
    </head>
    <body>
      <script>
        ${COMPONENT_GLOBAL} = require('${comp.path}')
        require('${PATH_TO_INIT_RENDERERS}')([${COMPONENT_GLOBAL}])
      </script>
    </body>
  </html>`

  fs.writeFile(pathToIndex, html, (err) => {
    if (err) throw err

    if (debug) {
      console.log(`created ${path.basename(pathToIndex)} for ${comp.name} component`)
    }

    const index = {
      path: pathToIndex,
      destroy: () => fs.unlinkSync(pathToIndex)
    }

    cb(index)
  })
}

module.exports = createIndex
