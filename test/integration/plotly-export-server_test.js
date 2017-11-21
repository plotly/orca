const tap = require('tap')
const Application = require('spectron').Application

const path = require('path')
const fs = require('fs')
const request = require('request')

const PORT = 9109
const SERVER_URL = `http://localhost:${PORT}`
const ROOT_PATH = path.join(__dirname, '..', '..')

// TODO
// - maybe just firing `plotly-export-server` in a child process would be enough?
//   + I don't see any spectron feature that could be useful to use
//     (they are mostly useful to inspect the app's window)
// - though checking window creation/deletion might be nice
//   for `plotly-dashboard` component

const app = new Application({
  path: path.join(ROOT_PATH, 'bin', 'plotly-export-server.js'),
  args: ['--port', PORT]
})

tap.tearDown(() => {
  if (app && app.isRunning()) {
    app.stop()
  }
})

tap.test('should launch', t => {
  app.start().then(() => {
    app.client.getWindowCount().then(cnt => {
      t.equal(cnt, 4)
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
        data: [{y: [1, 2, 1]}]
      }
    })
  }, (err, res, body) => {
    if (err) t.fail(err)

    t.equal(res.statusCode, 200, 'code')
    t.type(body, 'string')
    t.end()
  })

  // more tests using: https://github.com/image-size/image-size
})

tap.test('should work for *plotly-thumbnail* component', t => {
  request({
    method: 'POST',
    url: SERVER_URL + '/thumbnail',
    body: JSON.stringify({
      figure: {
        data: [{y: [1, 2, 1]}]
      }
    })
  }, (err, res, body) => {
    if (err) t.fail(err)

    t.equal(res.statusCode, 200, 'code')
    t.type(body, 'string', 'body type')
    t.end()
  })
})

tap.test('should work for *plotly-dashboard* component', {timeout: 1e5}, t => {
  t.test('responding with correct status code and body type', t => {
    request({
      method: 'POST',
      url: SERVER_URL + '/dashboard',
      body: JSON.stringify({
        fid: 'some-fid',
        url: 'https://plot.ly/dashboard/jackp:17872/embed',
        format: 'pdf'
      })
    }, (err, res, body) => {
      if (err) t.fail(err)

      t.equal(res.statusCode, 200, 'code')
      t.type(body, 'string', 'body type')
      t.end()
    })
  })

  t.test('piping info write stream', t => {
    const outPath = path.join(ROOT_PATH, 'build', 'dashboard.pdf')
    const ws = fs.createWriteStream(outPath)

    request({
      method: 'POST',
      url: SERVER_URL + '/dashboard',
      body: JSON.stringify({
        fid: 'some-fid',
        url: 'https://plot.ly/dashboard/jackp:17872/embed',
        format: 'pdf'
      })
    })
    .on('error', t.fail)
    .pipe(ws)

    ws.on('error', t.fail)
    ws.on('finish', () => {
      const size = fs.statSync(outPath).size
      t.ok(size > 1e4, 'min pdf file size')
      t.ok(size < 2e4, 'max pdf file size')
      t.end()
    })
  })

  t.end()
})

tap.test('should work for *plotly-dashboard-thumbnail* component', t => {
  const outPath = path.join(ROOT_PATH, 'build', 'dashboard-thumbnail.png')
  const ws = fs.createWriteStream(outPath)

  request({
    method: 'post',
    url: SERVER_URL + '/dashboard-thumbnail',
    body: JSON.stringify({
      settings: { backgroundColor: '#d3d3d3' },
      layout: {
        type: 'split',
        first: {
          type: 'split',
          first: {
            type: 'box',
            boxType: 'plot',
            figure: {
              data: [{
                y: [1, 2, 1]
              }]
            }
          },
          second: {
            type: 'box',
            boxType: 'plot',
            figure: {
              data: [{
                type: 'bar',
                y: [1, 2, 4]
              }]
            }
          }
        },
        second: {
          type: 'split',
          first: {
            type: 'box',
            boxType: 'plot',
            figure: {
              data: [{
                type: 'heatmap',
                z: [[1, 2, 4], [1, 2, 3]]
              }]
            }
          },
          second: {
            type: 'box',
            boxType: 'plot',
            figure: {
              data: [{
                type: 'scatter3d',
                x: [1, 2, 3],
                y: [1, 2, 3],
                z: [1, 2, 1]
              }]
            }
          }
        }
      }
    })
  })
  .on('error', t.fail)
  .pipe(ws)

  ws.on('error', t.fail)
  ws.on('finish', () => {
    const size = fs.statSync(outPath).size
    t.ok(size > 800, 'min png file size')
    t.ok(size < 6e4, 'max png file size')
    t.end()
  })
})

tap.test('should teardown', t => {
  app.stop()
    .catch(t.fail)
    .then(t.end)
})
