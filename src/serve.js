const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')
const http = require('http')
const fs = require('fs')
const textBody = require('body')
const uuid = require('uuid/v4')

const createIndex = require('./util/create-index')
const createTimer = require('./util/create-timer')
const coerceComponent = require('./util/coerce-component')
const isPositiveNumeric = require('./util/is-positive-numeric')

const BUFFER_OVERFLOW_LIMIT = 1e9
const REQUEST_TIMEOUT = 50000
const STATUS_MSG = {
  200: 'pong',
  401: 'error during request',
  499: 'client closed request before generation complete',
  404: 'invalid route',
  422: 'json parse error',
  501: 'renderer error',
  504: 'window for given route does not exist',
  522: 'client socket timeout'
}

/** Create server app
 *
 * @param {object} _opts
 *   - port {number} port number
 *   - debug {boolean} turn on debugging tooling
 *   - component {string, object}
 *     - name {string}
 *     - path {string}
 *     - ... other options to be passed to methods
 *
 * @return {object} app
 */
function createApp (_opts) {
  const opts = coerceOpts(_opts)

  const components = opts.component
  const server = createServer(app, opts)
  let timer = createTimer()
  let numberOfWindowstYetToBeLoaded = components.length

  // to render WebGL in headless environments
  app.commandLine.appendSwitch('ignore-gpu-blacklist')

  app.on('ready', () => {
    components.forEach((comp) => {
      let win = new BrowserWindow(opts._browserWindowOpts)
      comp._win = win

      if (opts.debug) {
        win.openDevTools()
      }

      win.on('closed', () => {
        win = null
      })

      createIndex(comp, opts, (pathToIndex) => {
        win.loadURL(`file://${pathToIndex}`)
        comp._pathToIndex = pathToIndex
      })

      win.webContents.once('did-finish-load', () => {
        if (--numberOfWindowstYetToBeLoaded === 0) {
          server.listen(opts.port, () => {
            app.emit('after-connect', {
              port: opts.port,
              startupTime: timer.end(),
              openRoutes: components.map((comp) => comp.route)
            })
          })
        }
      })
    })
  })

  server.on('error', (err) => {
    console.error(err)

    // quit if port is in used,
    // might be better way to do this?
    app.quit()
  })

  process.on('exit', () => {
    server.close()
    components.forEach((comp) => fs.unlinkSync(comp._pathToIndex))
  })

  ipcMain.on('renderer-error', (event, info) => {
    const code = 501
    app.emit('renderer-error', {
      code: code,
      msg: STATUS_MSG[code],
      error: info
    })
  })

  return app
}

function coerceOpts (_opts) {
  const opts = {}

  if (isPositiveNumeric(_opts.port)) {
    opts.port = Number(_opts.port)
  } else {
    throw new Error('invalid port number')
  }

  opts.debug = !!_opts.debug
  opts._browserWindowOpts = {}

  const _components = Array.isArray(_opts.component) ? _opts.component : [_opts.component]
  const componentLookup = {}
  opts.component = []

  _components.forEach((_comp) => {
    const comp = coerceComponent(_comp, opts.debug)

    if (comp) {
      if (componentLookup[comp.route]) {
        throw new Error('trying to register multiple components on same route')
      }

      componentLookup[comp.route] = comp
      opts.component.push(comp)
    }
  })

  if (opts.component.length === 0) {
    throw new Error('no valid component registered')
  }

  opts._componentLookup = componentLookup

  return opts
}

function createServer (app, opts) {
  let pending = 0

  return http.createServer((req, res) => {
    const timer = createTimer()
    const id = uuid()
    const route = req.url

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

    if (route === '/ping') {
      return simpleReply(200)
    }

    const comp = opts._componentLookup[route]

    if (!comp) {
      return errorReply(404)
    }

    if (!comp._win) {
      return errorReply(504)
    }

    const compOpts = comp.options

    // setup parse callback
    const sendToRenderer = (errorCode, parseInfo) => {
      Object.assign(fullInfo, parseInfo)

      if (errorCode) {
        return errorReply(errorCode)
      }

      comp._win.webContents.send(comp.name, id, fullInfo, compOpts)
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
      comp._module.parse(body, compOpts, sendToRenderer)
    })

    // convert on render message -> end response
    ipcMain.once(id, (event, errorCode, renderInfo) => {
      Object.assign(fullInfo, renderInfo)

      if (errorCode) {
        return errorReply(errorCode)
      }

      comp._module.convert(fullInfo, compOpts, reply)
    })
  })
}

module.exports = createApp
