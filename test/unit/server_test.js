const tap = require('tap')
const sinon = require('sinon')
const EventEmitter = require('events')
const request = require('request')

const coerceOpts = require('../../src/app/server/coerce-opts')
const createServer = require('../../src/app/server/create-server')

tap.test('coerceOpts:', t => {
  t.test('should throw', t => {
    t.test('when no valid component are registered', t => {
      t.throws(() => coerceOpts(), /invalid port number/)
      t.throws(() => coerceOpts({ port: 'not gonna work' }), /invalid port number/)
      t.end()
    })

    t.test('when no valid component are registered', t => {
      t.throws(() => coerceOpts({ port: 20 }), /no valid component registered/)
      t.end()
    })

    t.test('when registering multiple component on same route ', t => {
      t.throws(() => coerceOpts({
        port: 20,
        component: [{
          name: 'plotly-graph',
          route: '/'
        }, {
          name: 'plotly-dashboard',
          route: '/'
        }]
      }), /trying to register multiple components on same route/)
      t.end()
    })

    t.end()
  })

  t.test('should fill in defaults', t => {
    const out = coerceOpts({
      port: 1000,
      component: 'plotly-graph'
    })

    t.equal(out.port, 1000, 'port')
    t.equal(out.debug, false, 'debug')
    t.equal(out.cors, false, 'cors')
    t.equal(out.maxNumberOfWindows, 50, 'maxNumberOfWindows')
    t.equal(out.requestTimeout, 50000, 'requestTimeout')
    t.end()
  })

  t.test('should coerce numeric strings to numbers', t => {
    const out = coerceOpts({
      port: '1000',
      maxNumberOfWindows: '2',
      component: 'plotly-graph',
      requestTimeout: '50'
    })

    t.equal(out.port, 1000, 'port')
    t.equal(out.maxNumberOfWindows, 2, 'maxNumberOfWindows')
    t.equal(out.requestTimeout, 50000, 'requestTimeout')
    t.end()
  })

  t.end()
})

tap.test('createServer:', t => {
  const ipc0 = new EventEmitter()

  const mockWebContents = (opts, errorCode, result) => {
    errorCode = errorCode || null
    result = result || { imgData: 'image data yo!' }

    opts.component.forEach((comp) => {
      comp._win = {
        webContents: {
          send: (compName, id, fullInfo, compOpts) => {
            ipc0.emit(id, {}, errorCode, result)
          }
        },
        close: () => {}
      }
    })

    return opts
  }

  const BrowserWindow0 = () => ({
    getAllWindows: () => ({ length: 0 })
  })

  const opts0 = () => coerceOpts({
    port: 8001,
    component: {
      name: 'plotly-graph',
      route: '/'
    },
    requestTimeout: '1'
  })

  const optsCors = () => coerceOpts({
    cors: true,
    port: 8001,
    component: {
      name: 'plotly-graph',
      route: '/'
    }
  })

  const body0 = () => JSON.stringify({
    figure: {
      data: [{ y: [1, 2, 1] }]
    }
  })

  let server

  const _boot = (_args, cb) => {
    const app = _args[0] || new EventEmitter()
    const BrowserWindow = _args[1] || BrowserWindow0()
    const ipc = _args[2] || ipc0
    const opts = _args[3] || mockWebContents(opts0())
    const args = [app, BrowserWindow0, ipc, opts]

    server = createServer(app, BrowserWindow, ipc, opts)
    server.listen(opts.port, () => { cb(args) })
  }

  const _post = (route, body, cb) => {
    return request({
      method: 'post',
      url: `http://localhost:8001/${route}`,
      body: body
    }, cb)
  }

  t.afterEach((done) => {
    server.close()
    done()
  })

  t.test('should launch server', t => {
    _boot([], t.end)
  })

  t.test('should reply pong to ping post', t => {
    _boot([], () => {
      _post('ping', '', (err, res, body) => {
        if (err) t.fail(err)
        t.equal(body, 'pong')
        t.end()
      })
    })
  })

  t.test('should reply with access-control-* headers when CORS is enabled', t => {
    _boot([false, false, false, optsCors()], () => {
      _post('', '', (err, res, body) => {
        if (err) t.fail(err)
        t.equal(res.headers['access-control-allow-origin'], '*')
        t.equal(res.headers['access-control-allow-headers'], '*')
        t.match(res.headers['access-control-allow-methods'], 'GET')
        t.match(res.headers['access-control-allow-methods'], 'POST')
        t.match(res.headers['access-control-allow-methods'], 'OPTIONS')
        t.end()
      })
    })
  })

  t.test('should reply with HTTP status code 200 to OPTIONS request', t => {
    _boot([false, false, false, optsCors()], () => {
      return request({
        method: 'options',
        url: `http://localhost:8001/`,
        body: ''
      }, (err, res, body) => {
        if (err) t.fail(err)
        t.equal(res.statusCode, 200)
        t.end()
      })
    })
  })

  t.test('it should do HTTP content-negotation for *plotly-graph* component', t => {
    const mock = {
      layout: {
        data: [{ y: [1, 2, 1] }]
      }
    }
    const payload = JSON.stringify(mock)
    const SERVER_URL = 'http://localhost:8001'

    t.test('it should use the default format when mime type is unknown', t => {
      _boot([], () => {
        return request({
          method: 'POST',
          url: SERVER_URL + '/',
          headers: {
            'Accept': 'invalid_format'
          },
          body: payload
        }, (err, res, body) => {
          if (err) t.fail(err)
          t.equal(res.statusCode, 200, 'code')
          t.end()
        })
      })
    })

    t.test('it should return figure in requested format', t => {
      _boot([], () => {
        return request({
          method: 'POST',
          url: SERVER_URL + '/',
          headers: {
            'Accept': 'image/svg+xml'
          },
          body: payload
        }, (err, res, body) => {
          if (err) t.fail(err)

          t.equal(res.statusCode, 200, 'code')
          t.equal(res.headers['content-type'], 'image/svg+xml')
          t.end()
        })
      })
    })

    t.test('it should be overriden by format provided in payload', t => {
      _boot([], () => {
        request({
          method: 'POST',
          url: SERVER_URL + '/',
          headers: {
            'Accept': 'image/svg+xml'
          },
          body: JSON.stringify({
            format: 'png',
            figure: mock
          })
        }, (err, res, body) => {
          if (err) t.fail(err)

          t.equal(res.statusCode, 200, 'code')
          t.equal(res.headers['content-type'], 'image/png')
          t.end()
        })
      })
    })

    t.done()
  })

  t.test('should emit *after-export* on successful requests', t => {
    _boot([], (args) => {
      const app = args[0]

      app.on('after-export', (info) => {
        t.equal(Object.keys(info).length, 16, '# of keys')
        t.equal(info.method, 'POST', 'method')
        t.type(info.id, 'string', 'id')
        t.equal(info.port, args[3].port, 'port')
        t.equal(info.pending, 0, 'pending')
        t.type(info.processingTime, 'number')
      })

      app.on('export-error', t.fail)

      _post('', body0(), (err, res, body) => {
        if (err) t.fail(err)
        t.end()
      })
    })
  })

  t.test('should reply with HTTP status code 522 on request timeout', t => {
    const opts = mockWebContents(opts0())
    const _module = opts.component[0]._module
    sinon.stub(_module, 'parse').callsFake(function () {
      // force a timeout
      return new Promise((resolve) => setTimeout(resolve, 2000))
    })

    _boot([false, false, false, opts], (args) => {
      _post('', body0(), (err, res, body) => {
        if (err) t.fail(err)
        t.equal(res.statusCode, 522, 'status code')
        _module.parse.restore()
        t.end()
      })
    })
  })

  t.test('should emit *export-error*', t => {
    const wrapApp = (t, args, expectations) => {
      const app = args[0]
      app.on('after-export', t.fail)
      app.on('export-error', (info) => {
        t.type(info.id, 'string', 'id')
        t.equal(Object.keys(info).length, expectations[0], '# of keys')
        t.equal(info.code, expectations[1], 'error code')
        t.equal(info.msg, expectations[2], 'error msg')
      })
      return app
    }

    t.test('on invalid route', t => {
      _boot([], (args) => {
        wrapApp(t, args, [5, 404, 'invalid route'])

        _post('not-gonna-work', body0(), (err, res, body) => {
          if (err) t.fail()
          t.equal(res.statusCode, 404, 'status code')
          t.end()
        })
      })
    })

    t.test('if reference to window is loss', t => {
      const opts = opts0()

      _boot([false, false, false, opts], (args) => {
        wrapApp(t, args, [5, 504, 'window for given route does not exist'])

        _post('', body0(), (err, res, body) => {
          if (err) t.fail()
          t.equal(res.statusCode, 504, 'status code')
          t.end()
        })
      })
    })

    t.test('when more windows are open than max', t => {
      const BrowserWindow = BrowserWindow0()
      BrowserWindow.getAllWindows = () => ({ length: Infinity })

      _boot([false, BrowserWindow], (args) => {
        wrapApp(t, args, [5, 402, 'too many windows are opened'])

        _post('', body0(), (err, res, body) => {
          if (err) t.fail()
          t.equal(res.statusCode, 402, 'status code')
          t.end()
        })
      })
    })

    t.test('on json parse errors', t => {
      _boot([], (args) => {
        wrapApp(t, args, [5, 422, 'json parse error'])

        _post('', body0() + '/', (err, res, body) => {
          if (err) t.fail()
          t.equal(res.statusCode, 422, 'status code')
          t.end()
        })
      })
    })

    t.test('on module parse errors', t => {
      const opts = mockWebContents(opts0())
      const _module = opts.component[0]._module
      sinon.stub(_module, 'parse').yields(432)

      _boot([false, false, false, opts], (args) => {
        wrapApp(t, args, [5, 432, ''])

        _post('', body0(), (err, res, body) => {
          if (err) t.fail()
          t.equal(res.statusCode, 432, 'status code')
          _module.parse.restore()
          t.end()
        })
      })
    })

    t.test('on module render errors', t => {
      const opts = mockWebContents(opts0(), 467, { msg: 'error msg' })

      _boot([false, false, false, opts], (args) => {
        wrapApp(t, args, [12, 467, 'error msg'])

        _post('', body0(), (err, res, body) => {
          if (err) t.fail()
          t.equal(res.statusCode, 467, 'status code')
          t.end()
        })
      })
    })

    t.test('on module convert errors', t => {
      const opts = mockWebContents(opts0())
      const _module = opts.component[0]._module
      sinon.stub(_module, 'convert').yields(483)

      _boot([false, false, false, opts], (args) => {
        wrapApp(t, args, [15, 483, ''])

        _post('', body0(), (err, res, body) => {
          if (err) t.fail()
          t.equal(res.statusCode, 483, 'status code')
          _module.convert.restore()
          t.end()
        })
      })
    })

    t.end()
  })

  t.end()
})
