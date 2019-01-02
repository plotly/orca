const tap = require('tap')
const sinon = require('sinon')
const path = require('path')
const EventEmitter = require('events')

const coerceOpts = require('../../src/app/runner/coerce-opts')
const getBody = require('../../src/app/runner/get-body')
const run = require('../../src/app/runner/run')
const { paths, urls } = require('../common')

tap.test('coerceOpts:', t => {
  t.test('should throw', t => {
    t.test('on blank input', t => {
      t.throws(() => coerceOpts({ component: 'plotly-graph' }), /no valid input given/)
      t.end()
    })

    t.test('when no valid component are registered', t => {
      t.throws(() => coerceOpts(), /no valid component registered/)
      t.throws(() => coerceOpts({ input: paths.pkg }), /no valid component registered/)
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

  t.test('should coerce parallelLimit to a number', t => {
    const out = coerceOpts({
      input: ['10.json'],
      component: 'plotly-graph',
      parallelLimit: '2'
    })

    t.equal(out.parallelLimit, 2)
    t.end()
  })

  t.test('should concatenate glob to input items', t => {
    const out = coerceOpts({
      input: ['10.json', paths.glob],
      component: 'plotly-graph'
    })

    t.ok(out.input.length > 2)
    t.end()
  })

  t.test('should only pick first component if multiple are given', t => {
    const out = coerceOpts({
      input: ['10.json'],
      component: ['plotly-graph', 'other']
    })

    t.type(out.component, 'object')
    t.equal(out.component.name, 'plotly-graph')
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

  t.test('should accept url', t => {
    getBody(urls.plotlyGraphMock, (err, body) => {
      t.equal(err, null, 'error')
      t.type(body, 'string', 'body')
      t.end()
    })
  })

  t.test('should pass request error for bar url', t => {
    getBody(urls.dummy, (err) => {
      t.equal(err.code, 'ENOTFOUND', 'error')
      t.end()
    })
  })

  t.test('should accept path to file', t => {
    getBody(paths.readme, (err, body) => {
      t.equal(err, null, 'error')
      t.type(body, 'string', 'body')
      t.end()
    })
  })

  t.test('should accept path to file w/o json extension', t => {
    const parts = path.parse(paths.pkg)
    const item = path.join(parts.dir, parts.name)

    getBody(item, (err, body) => {
      t.equal(err, null, 'error')
      t.type(body, 'string', 'body')
      t.end()
    })
  })

  t.test('should accept and parse nested *figure* path', t => {
    getBody({
      figure: paths.pkg,
      format: 'png'
    }, (err, body) => {
      t.equal(err, null, 'error')
      t.type(body.figure, 'object')
      t.equal(body.format, 'png', 'other stuff in item')
      t.end()
    })
  })

  t.end()
})

tap.test('run:', t => {
  const ipc = new EventEmitter()

  const win = {
    webContents: {
      send: (compName, id, fullInfo, compOpts) => {
        ipc.emit(id, {}, null, { imgData: 'image data yo!' })
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
    const cases = ['"data":[{"y":[1,2,1]}]}', urls.dummy]

    cases.forEach(c => {
      t.test(`(case ${c}`, t => {
        const app = new EventEmitter()
        app.exit = t.end
        app.once('after-export', t.fail)

        app.once('export-error', (info) => {
          t.equal(info.code, 422, 'code')
          t.equal(info.msg, 'json parse error', 'msg')
        })

        app.once('after-export-all', (info) => {
          t.equal(info.code, 1, 'code')
        })

        _run(app, c)
      })
    })

    t.end()
  })

  t.test('should fire *after-export* and *after-export-all* on success', t => {
    const cases = ['{"data":[{"y":[1,2,1]}]}', { data: [{ y: [1, 2, -1] }] }]

    cases.forEach(c => {
      t.test(`(case ${c}`, t => {
        const app = new EventEmitter()
        app.exit = t.end
        app.once('export-error', t.fail)

        app.once('after-export', (info) => {
          t.equal(info.pending, 0, 'pending')
          t.type(info.processingTime, 'number', 'processingTime')
          t.type(info.body, Buffer, 'body')
          t.equal(info.imgData, 'image data yo!', 'imgData')
        })

        app.once('after-export-all', (info) => {
          t.equal(Object.keys(info).length, 3, '# of keys')
          t.equal(info.code, 0, 'code')
          t.equal(info.msg, 'all task(s) completed', 'msg')
          t.type(info.totalProcessingTime, 'number')
        })

        _run(app, c)
      })
    })

    t.end()
  })

  t.test('should fire *export-error* on module method errors', t => {
    const cases = ['parse', 'convert']

    cases.forEach(c => {
      t.test(`(case ${c})`, t => {
        const app = new EventEmitter()
        app.once('after-export', t.fail)

        const opts = coerceOpts({
          component: 'plotly-graph',
          input: '{"data":[{"y":[1,2,1]}]}'
        })

        // return some dummy error code
        sinon.stub(opts.component._module, c).yields(555)

        app.exit = () => {
          opts.component._module[c].restore()
          t.end()
        }

        app.once('export-error', (info) => {
          t.equal(info.code, 555, 'code')
        })

        app.once('after-export-all', (info) => {
          t.equal(info.code, 1, 'code')
        })

        run(app, win, ipc, opts)
      })
    })

    t.test('(case render)', t => {
      const win = {
        webContents: {
          send: (compName, id, fullInfo, compOpts) => {
            ipc.emit(id, {}, 555, { msg: 'error msg' })
          }
        },
        close: () => {}
      }

      const app = new EventEmitter()
      app.once('after-export', t.fail)
      app.exit = t.end

      const opts = coerceOpts({
        component: 'plotly-graph',
        input: '{"data":[{"y":[1,2,1]}]}'
      })

      app.once('export-error', (info) => {
        t.equal(info.code, 555, 'code')
      })

      app.once('after-export-all', (info) => {
        t.equal(info.code, 1, 'code')
      })

      run(app, win, ipc, opts)
    })

    t.end()
  })

  t.test('should not quit in debug mode', t => {
    const app = new EventEmitter()
    app.exit = t.fail

    const opts = coerceOpts({
      component: 'plotly-graph',
      input: '{"data":[{"y":[1,2,1]}]}',
      debug: true
    })

    // add timeout because app.quit is called
    // after 'after-export-all' is emitted,
    // testing that app.quit *really* is not called
    app.once('after-export-all', () => {
      setTimeout(t.end, 100)
    })

    run(app, win, ipc, opts)
  })

  t.end()
})
