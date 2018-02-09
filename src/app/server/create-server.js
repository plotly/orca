const http = require('http')
const textBody = require('body')
const uuid = require('uuid/v4')

const createTimer = require('../../util/create-timer')
const cst = require('./constants')
const Ping = require('./ping')

const BUFFER_OVERFLOW_LIMIT = cst.bufferOverflowLimit
const REQUEST_TIMEOUT = cst.requestTimeout
const STATUS_MSG = cst.statusMsg

/** Create server!
 *
 * @param {electron app} app
 * @param {ipcMain} ipcMain
 * @param {object} opts : app options
 *  - port
 *  - _componentLookup
 *    - _win
 */
function createServer (app, BrowserWindow, ipcMain, opts) {
  let pending = 0

  const server = http.createServer((req, res) => {
    const timer = createTimer()
    const id = uuid()
    const route = req.url

    // initialize 'full' info object
    //   which accumulates parse, render, convert results
    //   and is emitted on 'export-error' and 'after-export'
    const fullInfo = {
      port: opts.port,
      method: req.method,
      id: id
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
      Ping(ipcMain, opts.component)
        .then(() => simpleReply(200))
        .catch((err) => {
          fullInfo.msg = JSON.stringify(err, ['message', 'arguments', 'type', 'name'])
          errorReply(500)
        })

      return
    }

    const comp = opts._componentLookup[route]

    if (!comp) {
      return errorReply(404)
    }

    if (!comp._win) {
      return errorReply(504)
    }

    if (BrowserWindow.getAllWindows().length > opts.maxNumberOfWindows) {
      return errorReply(402)
    }

    const compOpts = comp.options

    // setup parse callback
    const sendToRenderer = (errorCode, parseInfo) => {
      Object.assign(fullInfo, parseInfo)

      if (errorCode) {
        return errorReply(errorCode)
      }

      console.log('webContents.send START');
      comp._win.webContents.send(comp.name, id, fullInfo, compOpts)
      console.log('webContents.send DONE');
    }

    // setup convert callback
    const reply = (errorCode, convertInfo) => {
      Object.assign(fullInfo, convertInfo)

      fullInfo.pending = --pending
      fullInfo.processingTime = timer.end()

      if (errorCode) {
        return errorReply(errorCode)
      }

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

    // setup convert on render message -> end response
    ipcMain.once(id, (event, errorCode, renderInfo) => {
      console.log('got render message back')
      Object.assign(fullInfo, renderInfo)

      if (errorCode) {
        return errorReply(errorCode)
      }

      comp._module.convert(fullInfo, compOpts, reply)
    })

    app.emit('before-export', fullInfo)

    pending++

    // parse -> send to renderer GO!
    if (typeof comp._module.parse == 'function') {
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

        comp._module.parse(body, compOpts, sendToRenderer)
        console.log('sendToRenderer done')
      })
    } else {
      console.log('null sendToRenderer START')
      sendToRenderer(null, null)
      console.log('null sendToRenderer DONE')
    }
  })

  server.on('error', (err) => {
    console.error(err)

    // TODO
    // - quit if port is in used, (might be better way to do this?)
    // - are there any other server errors we should look out for?
    // - what about
    //   https://github.com/plotly/streambed/blob/master/image_server/server_app/lib/soft-reset.js
    app.quit()
  })

  return server
}

module.exports = createServer
