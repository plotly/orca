const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid/v4')
const parallelLimit = require('run-parallel-limit')
const glob = require('glob')
const isUrl = require('is-url')
const request = require('request')

const createIndex = require('./util/create-index')
const createTimer = require('./util/create-timer')
const coerceComponent = require('./util/coerce-component')

const PARALLEL_LIMIT_DFLT = 4
const STATUS_MSG = {
  200: 'all task(s) completed',
  422: 'json parse error',
  500: 'incomplete task(s)',
  501: 'renderer error'
}

/** Create runner app
 *
 * @param {object} opts
 *   - input {string or array of strings}
 *   - component {string, object, array of a strings or array of objects}
 *     - name {string}
 *     - path {string}
 *     - route {string}
 *     - options {object}
 *   - debug {boolean} turn on debugging tooling
 *
 * @return {object} app
 */
function createApp (_opts) {
  const opts = coerceOptions(_opts)

  let win = null

  // to render WebGL in headless environments
  app.commandLine.appendSwitch('ignore-gpu-blacklist')

  app.on('ready', () => {
    win = new BrowserWindow(opts._browserWindowOpts)

    if (opts.debug) {
      win.openDevTools()
    }

    win.on('closed', () => {
      win = null
    })

    process.on('exit', () => {
      if (win) {
        win.close()
      }
    })

    createIndex(opts, (pathToIndex) => {
      win.loadURL(`file://${pathToIndex}`)
    })

    win.webContents.once('did-finish-load', () => {
      run(app, win, opts)
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

function coerceOptions (opts) {
  const fullOpts = {}

  fullOpts.debug = !!opts.debug
  fullOpts._browserWindowOpts = {}

  const comp = Array.isArray(opts.component) ? opts.component[0] : opts.component
  const fullComp = coerceComponent(comp)

  if (fullComp) {
    fullOpts.component = fullComp
  } else {
    throw new Error('no valid component registered')
  }

  const input = Array.isArray(opts.input) ? opts.input : [opts.input]
  const fullInput = []

  input.forEach((item) => {
    const matches = glob.sync(item)

    if (matches.length === 0) {
      fullInput.push(item)
    } else {
      fullInput.push(...matches)
    }
  })

  fullOpts.input = fullInput

  return fullOpts
}

function run (app, win, opts) {
  const input = opts.input
  const comp = opts.component
  const compOpts = comp.options

  let pending = input.length

  const tasks = input.map((item) => (done) => {
    const timer = createTimer()
    const id = uuid()

    // initialize 'full' info object
    //   which accumulates parse, render, convert results
    //   and is emitted on 'export-error' and 'after-export'
    const fullInfo = {
      item: item,
      // TODO won't work for string input, fallback to `new ${comp.name} (*)`
      itemName: path.parse(item).name
    }

    const errorOut = (code) => {
      fullInfo.msg = fullInfo.msg || STATUS_MSG[code] || ''

      app.emit('export-error', Object.assign(
        {code: code},
        fullInfo
      ))

      return done()
    }

    // setup parse callback
    const sendToRenderer = (errorCode, parseInfo) => {
      Object.assign(fullInfo, parseInfo)

      if (errorCode) {
        return errorOut(errorCode)
      }

      win.webContents.send(comp.name, id, fullInfo, compOpts)
    }

    // setup convert callback
    const reply = (errorCode, convertInfo) => {
      Object.assign(fullInfo, convertInfo)

      if (errorCode) {
        return errorOut(errorCode)
      }

      fullInfo.pending = --pending
      fullInfo.processingTime = timer.end()

      app.emit('after-export', fullInfo)
      done()
    }

    // parse -> send to renderer!
    getBody(item, (err, _body) => {
      let body

      if (err) {
        return errorOut(422)
      }

      if (typeof _body === 'string') {
        try {
          body = JSON.parse(_body)
        } catch (e) {
          return errorOut(422)
        }
      } else {
        body = _body
      }

      comp.parse(body, compOpts, sendToRenderer)
    })

    // convert on render message -> emit 'after-export'
    ipcMain.once(id, (event, errorCode, renderInfo) => {
      Object.assign(fullInfo, renderInfo)

      if (errorCode) {
        return errorOut(errorCode)
      }

      comp.convert(fullInfo, compOpts, reply)
    })
  })

  parallelLimit(tasks, PARALLEL_LIMIT_DFLT, (err) => {
    const code = (err || pending !== 0) ? 500 : 200

    app.emit('done', {
      code: code,
      msg: STATUS_MSG[code]
    })

    win.close()
    app.quit()
  })
}

function getBody (item, cb) {
  if (fs.existsSync(item)) {
    fs.readFile(item, 'utf-8', cb)
  } else if (isUrl(item)) {
    request.get(item, (err, res, body) => {
      if (res.statusCode === 200) {
        cb(null, body)
      } else {
        cb(err)
      }
    })
  } else {
    cb(null, item)
  }
}

module.exports = createApp
