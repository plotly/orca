const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid/v4')
const parallelLimit = require('run-parallel-limit')

const createIndex = require('./util/create-index')

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
      win.close()
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

  opts._browserWindowOpts = {
    width: 2048,
    height: 1024
  }

  opts._input = _opts.input

  return opts
}

function run (app, win, opts) {
  const comp = opts._comp
  let pending = opts._input.length

  const tasks = opts._input.map((item) => (done) => {
    const id = uuid()

    const sendToRenderer = (info) => {
      win.webContents.send(comp.name, id, info)
    }

    getFigure(item, (err, fig) => {
      if (err) throw err

      comp.parse(fig, opts, sendToRenderer)
    })

    ipcMain.once(id, (event, info) => {
      const reply = (head, body) => {
        app.emit('after-convert', {
          name: path.parse(item).name,
          head: head,
          body: body,
          pending: --pending
        })

        done()
      }

      comp.convert(event, info, reply)
    })
  })

  parallelLimit(tasks, 2, (err) => {
    if (err) console.warn(err)
    if (pending !== 0) console.warn('something is up !?!')

    win.close()
    app.emit('done')
  })
}

function getFigure (item, cb) {
  // handle read file, wget from url or string logic

  fs.readFile(item, 'utf-8', cb)
}

module.exports = createApp
