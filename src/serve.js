const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')
const http = require('http')
const textBody = require('body')
const uuid = require('uuid/v4')
const isNumeric = require('fast-isnumeric')

const createIndex = require('./util/create-index')
const createTimer = require('./util/create-timer')
const coerceComponent = require('./util/coerce-component')

const BUFFER_OVERFLOW_LIMIT = 1e9
const REQUEST_TIMEOUT = 50000
const STATUS_MSG = {
  200: 'pong',
  401: 'error during request',
  499: 'client closed request before generation complete',
  404: 'invalid route',
  422: 'json parse error',
  501: 'renderer error',
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

  let timer = createTimer()
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
      if (win) {
        win.close()
      }
    })

    createIndex(opts, (pathToIndex) => {
      win.loadURL(`file://${pathToIndex}`)
    })

    win.webContents.once('did-finish-load', () => {
      server.listen(opts.port, () => {
        app.emit('after-connect', {
          port: opts.port,
          startupTime: timer.end(),
          openRoutes: Object.keys(opts._componentLookup).map((r) => '/' + r)
        })
      })
    })

    ipcMain.on('renderer-error', (event, info) => {
      const code = 501
      app.emit('renderer-error', {
        code: code,
        msg: STATUS_MSG[code],
        error: info
      })
    })
  })

  return app
}

function coerceOpts (opts) {
  const fullOpts = {}

  // should we error out if no port is given?
  fullOpts.port = isNumeric(opts.port) ? Number(opts.port) : 8000
  fullOpts.debug = !!opts.debug
  fullOpts._browserWindowOpts = {}

  const components = Array.isArray(opts.component) ? opts.component : [opts.component]
  const componentLookup = {}
  fullOpts.component = []

  components.forEach((comp) => {
    const fullComp = coerceComponent(comp)

    if (fullComp) {
      fullComp.route = typeof comp.route === 'string' ? comp.route : comp.name
      componentLookup[comp.route] = fullComp
      fullOpts.component.push(fullComp)
    }
  })

  if (fullOpts.component.length === 0) {
    throw new Error('no valid component registered')
  }

  fullOpts._componentLookup = componentLookup

  return fullOpts
}

function createServer (app, win, opts) {
  let pending = 0

  return http.createServer((req, res) => {
    const timer = createTimer()
    const id = uuid()
    const route = req.url.substr(1)

    // initialize 'full' info object
    //   which accumulates parse, render, convert results
    //   and is emitted on 'export-error' and 'after-export'
    const fullInfo = {
      port: opts.port
    }

    const simpleReply = (code, msg) => {
      res.writeHead(code, {'Content-Type': 'text/plain'})
      return res.end(msg || STATUS_MSG[code])
    }

    const errorReply = (code) => {
      fullInfo.msg = fullInfo.msg || STATUS_MSG[code] || ''

      app.emit('export-error', Object.assign(
        {code: code},
        fullInfo
      ))

      return simpleReply(code, fullInfo.msg)
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
      return errorReply(404)
    }

    const compOpts = comp.options

    // setup parse callback
    const sendToRenderer = (errorCode, parseInfo) => {
      Object.assign(fullInfo, parseInfo)

      if (errorCode) {
        return errorReply(errorCode)
      }

      win.webContents.send(comp.name, id, fullInfo, compOpts)
    }

    // setup convert callback
    const reply = (errorCode, convertInfo) => {
      Object.assign(fullInfo, convertInfo)

      if (errorCode) {
        return errorReply(errorCode)
      }

      fullInfo.pending = --pending
      fullInfo.processingTime = timer.end()

      const cb = () => {
        app.emit('after-export', fullInfo)
      }

      res.writeHead(200, fullInfo.head)

      if (res.write(fullInfo.body)) {
        res.end(cb)
      } else {
        res.once('drain', () => res.end(cb))
      }
    }

    // parse -> send to renderer!
    textBody(req, {limit: BUFFER_OVERFLOW_LIMIT}, (err, _body) => {
      let body

      if (err) {
        return errorReply(422)
      }

      try {
        body = JSON.parse(_body)
      } catch (e) {
        return errorReply(422)
      }

      pending++
      comp.parse(body, compOpts, sendToRenderer)
    })

    // convert on render message -> end response
    ipcMain.once(id, (event, errorCode, renderInfo) => {
      Object.assign(fullInfo, renderInfo)

      if (errorCode) {
        return errorReply(errorCode)
      }

      comp.convert(fullInfo, compOpts, reply)
    })
  })
}

module.exports = createApp
