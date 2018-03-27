const tap = require('tap')
const sinon = require('sinon')

const _module = require('../../src/component/plotly-dash-preview')
const remote = require('../../src/util/remote')
const { createMockWindow } = require('../common')

tap.test('parse:', t => {
  const fn = _module.parse

  t.test('should error when invalid *url* field is given', t => {
    const shouldFail = ['', null, true, 1, {}, 'dummy']

    shouldFail.forEach(d => {
      t.test(`(case ${JSON.stringify(d)})`, t => {
        fn({url: d}, {}, (errorCode, result) => {
          t.equal(errorCode, 400)
          t.same(result, {"msg": "invalid url"})
          t.end()
        })
      })
    })

    t.end()
  })

  t.test('should error when neither loading_selector or timeout is given', t => {
    
    fn({url: 'https://dash-app.com'}, {}, (errorCode, result) => {
      t.equal(errorCode, 400)
      t.equal(result.msg, 'either loading_selector or timeout must be specified')
      t.end()
    })
  })

  t.test('should error when pageSize is not given', t => {
    
    fn({
      url: 'https://dash-app.com',
      loading_selector: 'dummy',
    }, {}, (errorCode, result) => {
      t.equal(errorCode, 400)
      t.same(result.msg, 'pageSize must either be A3, A4, A5, Legal, Letter, ' + 
                         'Tabloid or an Object containing height and width in microns.')
      t.end()
    })
  })

  t.end()
})

tap.test('render:', t => {
  const fn = _module.render

  t.afterEach((done) => {
    remote.createBrowserWindow.restore()
    done()
  })

  t.test('should call printToPDF', t => {
    const win = createMockWindow()
    sinon.stub(remote, 'createBrowserWindow').returns(win)
    win.webContents.executeJavaScript.resolves(true)
    win.webContents.printToPDF.yields(null, '-> image data <-')

    fn({
      url: 'https://dummy.com'
    }, {}, (errorCode, result) => {
      t.ok(win.webContents.printToPDF.calledOnce)
      t.ok(win.close.calledOnce)
      t.equal(errorCode, undefined, 'code')
      t.equal(result.imgData, '-> image data <-', 'result')
      t.end()
    })
  })

  t.test('should handle executeJavascript errors', t => {
    const win = createMockWindow()
    sinon.stub(remote, 'createBrowserWindow').returns(win)
    win.webContents.executeJavaScript.rejects('fail to load')
    win.webContents.printToPDF.yields(null, '-> image data <-')

    fn({
      url: 'https://dummy.com'
    }, {}, (errorCode, result) => {
      t.ok(win.webContents.printToPDF.notCalled)
      t.ok(win.close.calledOnce)
      t.equal(errorCode, 525, 'code')
      t.same(result, {"msg": "dash preview generation failed"}, 'result')
      t.end()
    })
  })

  t.test('should handle printToPDF errors', t => {
    const win = createMockWindow()
    sinon.stub(remote, 'createBrowserWindow').returns(win)
    win.webContents.executeJavaScript.resolves(true)
    win.webContents.printToPDF.yields(new Error('printToPDF error'))

    fn({
      url: 'https://dummy.com'
    }, {}, (errorCode, result) => {
      t.ok(win.webContents.printToPDF.calledOnce)
      t.ok(win.close.calledOnce)
      t.equal(errorCode, 525, 'code')
      t.equal(result.msg, 'dash preview generation failed', 'error msg')
      t.end()
    })
  })

  t.end()
})
