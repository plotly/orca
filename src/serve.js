const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')
const http = require('http')
const textBody = require('body')
const uuid = require('uuid/v4')
const isNumeric = require('fast-isnumeric')

// const coerceCommon = require('./util/coerce-common')
// const isValidComponent = require('./util/is-valid-component')
const createIndex = require('./util/create-index')

const BUFFER_OVERFLOW_LIMIT = 1e9
const REQUEST_TIMEOUT = 50000
const STATUS_MSG = {
  200: 'pong',
  401: 'error during request',
  499: 'client closed request before generation complete',
  404: 'invalid route',
  422: 'json parse error',
  522: 'client socket timeout'
}

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
      server.listen(opts.port, () => {
        app.emit('after-connect', {
          port: opts.port
        })
      })
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

    const simpleReply = (code, _msg) => {
      const msg = _msg || STATUS_MSG[code]

      app.emit('error', {
        code: code,
        msg: msg
      })

      res.writeHead(code, {'Content-Type': 'text/plain'})
      return res.end(msg)
    }

    req.once('error', () => simpleReply(401))
    req.once('close', () => simpleReply(499))

    req.socket.removeAllListeners('timeout')
    req.socket.on('timeout', () => simpleReply(522))
    req.socket.setTimeout(REQUEST_TIMEOUT)

    if (route === 'ping') {
      return simpleReply(200)
    }

    const comp = opts._componentLookup[route]

    if (!comp) {
      return simpleReply(404)
    }

    const sendToRenderer = (errorCode, info) => {
      if (errorCode) {
        return simpleReply(errorCode, info)
      }

      win.webContents.send(comp.name, id, info, opts)
    }

    textBody(req, {limit: BUFFER_OVERFLOW_LIMIT}, (err, _body) => {
      let body

      if (err) {
        return simpleReply(422)
      }

      try {
        body = JSON.parse(_body)
      } catch (e) {
        return simpleReply(422)
      }

      pending++
      comp.parse(body, opts, sendToRenderer)
    })

    ipcMain.once(id, (event, errorCode, info) => {
      if (errorCode) {
        return simpleReply(errorCode, info)
      }

      const reply = (errorCode, head, body) => {
        if (errorCode) {
          return simpleReply(errorCode, head)
        }

        const cb = () => {
          app.emit('after-convert', {
            port: opts.port,
            // TODO this won't match 1-to-1 in general !!
            // we might need a meta argument to `reply` ?!?
            head: head,
            pending: --pending
          })
        }

        res.writeHead(200, head)

        if (res.write(body)) {
          res.end(cb)
        } else {
          res.once('drain', () => res.end(cb))
        }
      }

      comp.convert(info, opts, reply)
    })
  })
}

module.exports = createApp
