const tap = require('tap')
const Application = require('spectron').Application

const { paths } = require('../common')
const path = require('path')

const PORT = 9111

const numberOfComponents = 6
const axios = require('axios')
const fs = require('fs')
const pathToPlotlyJS = path.join(paths.build, 'plotly-latest.min.js')

const app = new Application({
  path: paths.bin,
  args: ['serve', '--port', PORT, '--plotlyjs', pathToPlotlyJS]
})

tap.tearDown(() => {
  if (app && app.isRunning()) {
    app.stop()
  }
})

tap.test('should launch', t => {
  axios.request({
    url: 'https://cdn.plot.ly/plotly-latest.min.js',
    method: 'get'
  })
    .then((result) => {
      fs.writeFileSync(pathToPlotlyJS, result.data)
    })
    .then(() => {
      return app.start()
    })
    .then(() => {
      app.client.getWindowCount().then(cnt => {
        t.equal(cnt, numberOfComponents)
        t.end()
      })
    })
    .catch(err => {
      t.fail(err)
      t.end()
    })
})

function getScriptTagsSrc (index) {
  // executeJavaScript in Spectron is broken https://github.com/electron/spectron/issues/163
  return app.client.windowByIndex(index).then(() => {
    return app.client.execute(() => {
      var htmlCollection = document.getElementsByTagName('script')
      var arr = [].slice.call(htmlCollection)
      return arr.map(script => {
        return script.src
      })
    })
  })
}

tap.test('should not link to resources on the network', t => {
  var promises = []
  for (var i = 0; i < numberOfComponents; i++) {
    promises.push(getScriptTagsSrc(0))
  }
  Promise.all(promises).then(values => {
    values.forEach(result => {
      var urls = result.value
      urls.forEach(url => {
        t.notOk(url.match('http'), `A script tag refers to an HTTP(S) resource ${url}`)
      })
    })
    t.end()
  })
    .catch(err => {
      t.fail(err)
      t.end()
    })
})

tap.test('should teardown', t => {
  app.stop()
    .catch(t.fail)
    .then(t.end)
})
