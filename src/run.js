const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')
const fs = require('fs')
const uuid = require('uuid/v4')
const parallelLimit = require('run-parallel-limit')
const glob = require('glob')
const isUrl = require('is-url')
const request = require('request')

const createIndex = require('./util/create-index')
const createTimer = require('./util/create-timer')
const coerceComponent = require('./util/coerce-component')
const isPositiveNumeric = require('./util/is-positive-numeric')

const PARALLEL_LIMIT_DFLT = 4
const STATUS_MSG = {
  200: 'all task(s) completed',
  422: 'json parse error',
  500: 'incomplete task(s)',
  501: 'renderer error'
}

/** Create runner app
 *
 * @param {object} _opts
 *   - input {string or array of strings}
 *   - debug {boolean} turn on debugging tooling
 *   - component {string, object, array of a strings or array of objects}
 *     - name {string}
 *     - path {string}
 *     - ... other options to be passed to methods
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

    createIndex(opts.component, (err, pathToIndex) => {
      if (err) throw err
      win.loadURL(`file://${pathToIndex}`)
    })

    win.webContents.once('did-finish-load', () => {
      run(app, win, opts)
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

  return app
}

function coerceOptions (_opts) {
  const opts = {}

  opts.debug = !!_opts.debug
  opts._browserWindowOpts = {}

  opts.parallelLimit = isPositiveNumeric(_opts.parallelLimit)
    ? Number(_opts.parallelLimit)
    : PARALLEL_LIMIT_DFLT

  const _comp = Array.isArray(_opts.component) ? _opts.component[0] : _opts.component
  const comp = coerceComponent(_comp, opts.debug)

  if (comp) {
    opts.component = comp
  } else {
    throw new Error('no valid component registered')
  }

  const _input = Array.isArray(_opts.input) ? _opts.input : [_opts.input]
  let input = []

  _input.forEach((item) => {
    const matches = glob.sync(item)

    if (matches.length === 0) {
      input.push(item)
    } else {
      input = input.concat(matches)
    }
  })

  opts.input = input

  return opts
}

function run (app, win, opts) {
  const input = opts.input
  const comp = opts.component
  const totalTimer = createTimer()

  let pending = input.length

  const tasks = input.map((item, i) => (done) => {
    const timer = createTimer()
    const id = uuid()

    // initialize 'full' info object
    //   which accumulates parse, render, convert results
    //   and is emitted on 'export-error' and 'after-export'
    const fullInfo = {
      itemIndex: i
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

      win.webContents.send(comp.name, id, fullInfo)
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

      comp.parse(body, sendToRenderer)
    })

    // convert on render message -> emit 'after-export'
    ipcMain.once(id, (event, errorCode, renderInfo) => {
      Object.assign(fullInfo, renderInfo)

      if (errorCode) {
        return errorOut(errorCode)
      }

      comp.convert(fullInfo, reply)
    })
  })

  parallelLimit(tasks, opts.parallelLimit, (err) => {
    const code = (err || pending !== 0) ? 500 : 200

    app.emit('after-export-all', {
      code: code,
      msg: STATUS_MSG[code],
      totalProcessingTime: totalTimer.end()
    })

    // do not close window to look for unlogged console errors
    if (!opts.debug) {
      win.close()
      app.quit()
    }
  })
}

function getBody (item, cb) {
  if (fs.existsSync(item)) {
    fs.readFile(item, 'utf-8', cb)
  } else if (fs.existsSync(item + '.json')) {
    fs.readFile(item + '.json', 'utf-8', cb)
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
