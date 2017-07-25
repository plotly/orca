const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')
const http = require('http')
const textBody = require('body')
const uuid = require('uuid/v4')
const isNumeric = require('fast-isnumeric')

// const coerceCommon = require('./util/coerce-common')
// const isValidComponent = require('./util/is-valid-component')
const createIndex = require('./util/create-index')

/** Create
 *
 * @param {object} opts
 *   - component
 *   - port
 *   - ...
 *   - debug
 *
 *
 * @return {object} app
 */
function createApp (_opts) {
  const opts = coerceOpts(_opts)

  let server = null
  let win = null

  app.commandLine.appendSwitch('ignore-gpu-blacklist')

  app.on('ready', () => {
    win = new BrowserWindow(opts._browserWindowOpts)
    server = createServer(app, win, opts)

    if (opts.debug) {
      win.openDevTools()
    }

    win.on('closed', () => {
      server.close()
      win = null
    })

    process.on('exit', () => {
      server.close()
      win.close()
    })

    createIndex(opts, (pathToIndex) => {
      win.loadURL(`file://${pathToIndex}`)
    })

    win.webContents.once('did-finish-load', () => {
      server.listen(Number(opts.port), opts.debug
        ? () => console.log(`listening on port ${opts.port}`)
        : () => {}
      )
    })
  })

  return app
}

function coerceOpts (_opts) {
  const opts = {}

  opts.port = isNumeric(_opts.port) ? Number(_opts.port) : 8000
  opts.debug = !!_opts.debug

  opts._componentLookup = {
    'plotly-graph': require('./component/plotly-graph')
  }

  opts._browserWindowOpts = {
    width: 2048,
    height: 1024
  }

  return opts
}

function createServer (app, win, opts) {
  let pending = 0

  return http.createServer((req, res) => {
    const id = uuid()
    const route = req.url.substr(1)

    if (route === 'ping') {
      res.writeHead(200, {'Content-Type': 'text/plain'})
      return res.end('pong')
    }

    const comp = opts._componentLookup[route]

    if (!comp) {
      res.writeHead(404, {'Content-Type': 'text/plain'})
      return res.end(`invalid route: ${route}`)
    }

    const sendToRenderer = (info) => {
      win.webContents.send(comp.name, id, info)
    }

    textBody(req, {limit: 1e9}, (err, body) => {
      if (err) {
        res.writeHead(500, {'Content-Type': 'text/plain'})
        return res.end('body parse error')
      }

      pending++
      comp.parse(body, opts, sendToRenderer)
    })

    ipcMain.once(id, (event, info) => {
      const cb = () => {
        pending--
        app.emit('after-convert', {pending: pending})
      }

      const reply = (head, body) => {
        res.writeHead(info.code, head)

        if (res.write(body)) {
          res.end(cb)
        } else {
          res.once('drain', () => res.end(cb))
        }
      }

      comp.convert(event, info, reply)
    })
  })
}

module.exports = createApp
