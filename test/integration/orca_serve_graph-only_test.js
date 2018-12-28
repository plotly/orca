const tap = require('tap')
const Application = require('spectron').Application
const request = require('request')

const { paths } = require('../common')
const PORT = 9110
const SERVER_URL = `http://localhost:${PORT}`

const app = new Application({
  path: paths.bin,
  args: ['serve', '--port', PORT, '--graph-only']
})

tap.tearDown(() => {
  if (app && app.isRunning()) {
    app.stop()
  }
})

tap.test('should launch', t => {
  app.start().then(() => {
    app.client.getWindowCount().then(cnt => {
      // Only one window since only graph component should be running
      t.equal(cnt, 1)
      t.end()
    })
  })
})

tap.test('should reply pong to ping POST', t => {
  request.post(SERVER_URL + '/ping', (err, res, body) => {
    if (err) t.fail(err)

    t.equal(res.statusCode, 200, 'code')
    t.equal(body, 'pong', 'body')
    t.end()
  })
})

tap.test('should work for *plotly-graph* component', t => {
  request({
    method: 'POST',
    url: SERVER_URL + '/',
    body: JSON.stringify({
      figure: {
        layout: {
          data: [{ y: [1, 2, 1] }]
        }
      }
    })
  }, (err, res, body) => {
    if (err) t.fail(err)

    t.equal(res.statusCode, 200, 'code')
    t.type(body, 'string')
    t.end()
  })
})

tap.test('should not work for *plotly-thumbnail* component', t => {
  request({
    method: 'POST',
    url: SERVER_URL + '/thumbnail',
    body: JSON.stringify({
      figure: {
        layout: {
          data: [{ y: [1, 2, 1] }]
        }
      }
    })
  }, (err, res) => {
    if (err) t.fail(err)

    t.equal(res.statusCode, 404, 'should return a HTTP 404 response')
    t.end()
  })
})

tap.test('should teardown', t => {
  app.stop()
    .catch(t.fail)
    .then(t.end)
})
