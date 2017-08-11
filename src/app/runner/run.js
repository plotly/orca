const uuid = require('uuid/v4')
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

    // setup convert on render message -> emit 'after-export'
    ipcMain.once(id, (event, errorCode, renderInfo) => {
      Object.assign(fullInfo, renderInfo)

      if (errorCode) {
        return errorOut(errorCode)
      }

      comp._module.convert(fullInfo, compOpts, reply)
    })

    // parse -> send to renderer GO!
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

      comp._module.parse(body, compOpts, sendToRenderer)
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

module.exports = run
