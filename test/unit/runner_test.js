const tap = require('tap')
const EventEmitter = require('events')

const coerceOpts = require('../../src/app/runner/coerce-opts')
const getBody = require('../../src/app/runner/get-body')
const run = require('../../src/app/runner/run')

tap.test('coerceOpts:', t => {
  t.test('should throw', t => {
    t.test('on blank input', t => {
      t.throws(() => coerceOpts())
      t.end()
    })

    t.end()
  })

  t.test('should fill in defaults', t => {
    const out = coerceOpts({
      input: ['10.json'],
      component: 'plotly-graph'
    })

    t.same(out.input, ['10.json'])
    t.equal(out.debug, false)
    t.end()
  })

  t.end()
})

tap.test('getBody:', t => {
  t.test('should accept strings', t => {
    getBody('should work', (err, body) => {
      t.equal(err, null, 'error')
      t.equal(body, 'should work', 'body')
      t.end()
    })
  })

  t.end()
})

tap.only('run:', t => {
  const ipc = new EventEmitter()

  const win = {
    webContents: {
      send: (compName, id, fullInfo, compOpts) => {
        ipc.emit(id, {}, null, {imgData: 'image data yo!'})
      }
    },
    close: () => {}
  }

  const _run = (app, input) => {
    run(app, win, ipc, coerceOpts({
      component: 'plotly-graph',
      input: input
    }))
  }

  t.test('should fire *export-error* on parse errors', t => {
    const app = new EventEmitter()
    app.quit = t.end
    app.once('after-export', t.fail)

    app.once('export-error', (info) => {
      t.equal(info.code, 422, 'code')
      t.equal(info.msg, 'json parse error', 'msg')
    })

    app.once('after-export-all', (info) => {
      t.equal(info.code, 500, 'code')
    })

    _run(app, '"data":[{"y":[1,2,1]}]}')
  })

  t.test('should fire *after-export* and *after-export-all* on success', t => {
    const app = new EventEmitter()
    app.quit = t.end
    app.once('export-error', t.fail)

    app.once('after-export', (info) => {
      t.equal(info.pending, 0, 'pending')
      t.type(info.processingTime, 'number', 'processingTime')
      t.type(info.body, Buffer, 'body')
      t.equal(info.imgData, 'image data yo!', 'imgData')
    })

    app.once('after-export-all', (info) => {
      t.equal(Object.keys(info).length, 3, '# of keys')
      t.equal(info.code, 200, 'code')
      t.equal(info.msg, 'all task(s) completed', 'msg')
      t.type(info.totalProcessingTime, 'number')
    })

    _run(app, '{"data":[{"y":[1,2,1]}]}')
  })

  t.end()
})
