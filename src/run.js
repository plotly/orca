const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid/v4')
const parallelLimit = require('run-parallel-limit')

const createIndex = require('./util/create-index')
const createTimer = require('./util/create-timer')

const PARALLEL_LIMIT_DFLT = 4
const STATUS_MSG = {
  422: 'json parse error',
  500: 'incomplete task(s)'
}

/** Create
 *
 * @param {object} opts
 *   - input
 *   - component
 *   - ...
 *   - debug
 *
 *
 * @return {object} app
 */
function createApp (_opts) {
  const opts = coerceOptions(_opts)

  let win = null

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
  })

  return app
}

function coerceOptions (_opts) {
  const opts = {}

  // handle glob to list

  opts.debug = !!_opts.debug

  opts._comp = require('./component/plotly-graph')

  opts._browserWindowOpts = {}

  opts._input = _opts.input

  return opts
}

function run (app, win, opts) {
  const comp = opts._comp
  let pending = opts._input.length

  const emitError = (code, info) => {
    info = info || {}
    info.msg = info.msg || STATUS_MSG[code] || ''

    app.emit('export-error', Object.assign(
      {code: code},
      info
    ))
  }

  const tasks = opts._input.map((item) => (done) => {
    const timer = createTimer()
    const id = uuid()

    // initialize 'full' info object
    //   which accumulates parse, render, convert results
    //   and is emitted on 'export-error' and 'after-convert'
    const fullInfo = {
      item: item,
      itemName: path.parse(item).name
    }

    const errorOut = (code) => {
      emitError(code, fullInfo)
      done()
    }

    // setup parse callback
    const sendToRenderer = (errorCode, parseInfo) => {
      Object.assign(fullInfo, parseInfo)

      if (errorCode) {
        return errorOut(errorCode)
      }

      win.webContents.send(comp.name, id, fullInfo, opts)
    }

    // setup convert callback
    const reply = (errorCode, convertInfo) => {
      Object.assign(fullInfo, convertInfo)

      if (errorCode) {
        return errorOut(errorCode)
      }

      fullInfo.pending = --pending
      fullInfo.processingTime = timer.end()

      app.emit('after-convert', fullInfo)
      done()
    }

    // parse -> send to renderer!
    getBody(item, (err, _body) => {
      let body

      if (err) {
        return errorOut(422)
      }

      try {
        body = JSON.parse(_body)
      } catch (e) {
        return errorOut(422)
      }

      comp.parse(body, opts, sendToRenderer)
    })

    // convert on render message -> emit 'after-convert'
    ipcMain.once(id, (event, errorCode, renderInfo) => {
      Object.assign(fullInfo, renderInfo)

      if (errorCode) {
        return errorOut(errorCode)
      }

      comp.convert(fullInfo, opts, reply)
    })
  })

  parallelLimit(tasks, PARALLEL_LIMIT_DFLT, (err) => {
    if (err || pending !== 0) {
      emitError(500)
    }

    app.emit('done')
    win.close()
  })
}

function getBody (item, cb) {
  // handle read file, wget from url or string logic

  fs.readFile(item, 'utf-8', cb)
}

module.exports = createApp
