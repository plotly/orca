const uuid = require('uuid/v4')
const isNumeric = require('fast-isnumeric')
const parallelLimit = require('run-parallel-limit')

const createTimer = require('../../util/create-timer')
const getBody = require('./get-body')
const cst = require('./constants')

const STATUS_MSG = cst.statusMsg

/** Run input -> image!
 *
 * @param {electron app} app
 * @param {electron window} win
 * @param {ipcMain} ipcMain
 * @param {object} opts : app options
 *  - input
 *  - component
 *  - parallelLimit
 *  - debug
 */
function run (app, win, ipcMain, opts) {
  const input = opts.input
  const comp = opts.component
  const compOpts = comp.options
  const totalTimer = createTimer()

  let pending = input.length
  let failed = 0

  const tasks = input.map((item, i) => (cb) => {
    const timer = createTimer()
    const id = uuid()

    // initialize 'full' info object
    //   which accumulates parse, render, convert results
    //   and is emitted on 'export-error' and 'after-export'
    const fullInfo = {
      itemIndex: i,
      id: id
    }

    // task callback wrapper:
    // - emits 'export-error' if given error code or error obj/msg
    // - emits 'after-export' if no argument is given
    const done = (err) => {
      fullInfo.pending = --pending
      fullInfo.processingTime = timer.end()

      if (err) {
        failed++

        if (isNumeric(err)) {
          fullInfo.code = err
        } else {
          fullInfo.code = 501
          fullInfo.error = err
        }

        fullInfo.msg = fullInfo.msg || STATUS_MSG[fullInfo.code] || ''
        app.emit('export-error', fullInfo)
      } else {
        app.emit('after-export', fullInfo)
      }

      cb()
    }

    // setup parse callback
    const sendToRenderer = (errorCode, parseInfo) => {
      Object.assign(fullInfo, parseInfo)

      if (errorCode) {
        return done(errorCode)
      }

      win.webContents.send(comp.name, id, fullInfo, compOpts)
    }

    // setup convert callback
    const reply = (errorCode, convertInfo) => {
      Object.assign(fullInfo, convertInfo)

      if (errorCode) {
        return done(errorCode)
      }

      if (opts.write) {
        opts.write(fullInfo, compOpts, done)
      } else {
        done()
      }
    }

    // setup convert on render message -> emit 'after-export'
    ipcMain.once(id, (event, errorCode, renderInfo) => {
      Object.assign(fullInfo, renderInfo)

      if (errorCode) {
        return done(errorCode)
      }

      comp._module.convert(fullInfo, compOpts, reply)
    })

    // parse -> send to renderer GO!
    getBody(item, (err, _body) => {
      let body

      if (err) {
        return done(422)
      }

      if (typeof _body === 'string') {
        try {
          body = JSON.parse(_body)
        } catch (e) {
          return done(422)
        }
      } else {
        body = _body
      }

      comp._module.parse(body, compOpts, sendToRenderer)
    })
  })

  parallelLimit(tasks, opts.parallelLimit, (err) => {
    const exitCode = (err || pending > 0 || failed > 0) ? 1 : 0

    app.emit('after-export-all', {
      code: exitCode,
      msg: STATUS_MSG[exitCode],
      totalProcessingTime: totalTimer.end()
    })

    // do not close window to look for unlogged console errors
    if (!opts.debug) {
      app.exit(exitCode)
    }
  })
}

module.exports = run
