const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid/v4')
const parallelLimit = require('run-parallel-limit')

const createIndex = require('./util/create-index')

const PARALLEL_LIMIT_DFLT = 4
const STATUS_MSG = {
  422: 'json parse error',
  500: 'incomplete asks'
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

    // on uncaughtException too?
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

  const emitError = (code, msg) => {
    app.emit('error', {
      code: code,
      msg: msg || STATUS_MSG[code]
    })
  }

  const tasks = opts._input.map((item) => (done) => {
    const id = uuid()

    const errorOut = (code, msg) => {
      emitError(code, msg)
      done()
    }

    const sendToRenderer = (errorCode, info) => {
      if (errorCode) {
        return errorOut(errorCode, info)
      }

      win.webContents.send(comp.name, id, info, opts)
    }

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

    ipcMain.once(id, (event, errorCode, info) => {
      if (errorCode) {
        return errorOut(errorCode, info)
      }

      const reply = (errorCode, head, body) => {
        if (errorCode) {
          return errorOut(errorCode, head)
        }

        app.emit('after-convert', {
          name: path.parse(item).name,
          head: head,
          body: body,
          pending: --pending
        })
        done()
      }

      comp.convert(info, opts, reply)
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
