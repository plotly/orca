const tap = require('tap')
const EventEmitter = require('events')
const request = require('request')

const coerceOpts = require('../../src/app/server/coerce-opts')
const createServer = require('../../src/app/server/create-server')

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
      port: '1000',
      component: 'plotly-graph'
    })

    t.equal(out.port, 1000)
    t.equal(out.debug, false)
    t.end()
  })

  t.end()
})

tap.test('createServer:', t => {
  const app = new EventEmitter()
  app.on('export-error', () => console.log('export-error'))
  app.on('after-export', () => console.log('after-export'))
  app.quit = () => console.log('quit')

  const opts = coerceOpts({
    port: '1000',
    component: 'plotly-graph'
  })

  opts.component.forEach((comp) => {
    comp._win = {
      webContents: {
        send: () => {}
      }
    }
  })

  const ipc = new EventEmitter()
  const server = createServer(app, ipc, opts)
  server.on('error', console.warn)

  t.test('should launch server', t => {
    server.listen(8001, t.end)
  })

  t.test('should reply pong to ping post', t => {
    request.post('http://localhost:8001/ping', (err, res, body) => {
      if (err) t.fail(err)
      t.equal(body, 'pong')
      t.end()
    })
  })

  t.tearDown(() => server.close())
  t.end()
})
