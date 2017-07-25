const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid/v4')

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
  let pending = 0

  // https://github.com/feross/run-parallel-limit

  opts._input.forEach((item) => {
    const id = uuid()

    const sendToRenderer = (info) => {
      win.webContents.send(comp.name, id, info)
    }

    getFigure(item, (err, fig) => {
      if (err) throw err

      pending++
      comp.parse(fig, opts, sendToRenderer)
    })

    ipcMain.once(id, (event, info) => {
      const reply = (head, body) => {
        pending--

        app.emit('after-convert', {
          name: path.parse(item).name,
          head: head,
          body: body,
          pending: pending
        })

        if (pending === 0) {
          win.close()
          app.emit('done')
        }
      }

      comp.convert(event, info, reply)
    })
  })
}

function getFigure (item, cb) {
  // handle read file, wget from url or string logic

  fs.readFile(item, 'utf-8', cb)
}

module.exports = createApp
