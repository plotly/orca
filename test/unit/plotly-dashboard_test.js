const tap = require('tap')
const sinon = require('sinon')

const _module = require('../../src/component/plotly-dashboard')
const cst = require('../../src/component/plotly-dashboard/constants')
const remote = require('../../src/util/remote')
const { createMockWindow, stubProp } = require('../common')

tap.test('parse:', t => {
  const fn = _module.parse

  t.test('should error when no *url* field is given', t => {
    const shouldFail = ['', null, true, 1, {}]

    shouldFail.forEach(d => {
      t.test(`(case ${JSON.stringify(d)})`, t => {
        fn({ url: d }, {}, {}, (errorCode, result) => {
          t.equal(errorCode, 400, 'code')
          t.end()
        })
      })
    })

    t.end()
  })

  t.end()
})

tap.test('render:', t => {
  const fn = _module.render
  const restoreIframeLoadDelay = stubProp(cst, 'iframeLoadDelay', 0)

  t.afterEach((done) => {
    remote.createBrowserWindow.restore()
    done()
  })

  t.tearDown(() => {
    restoreIframeLoadDelay()
  })

  t.test('should call printToPDF', t => {
    const win = createMockWindow()
    sinon.stub(remote, 'createBrowserWindow').returns(win)
    win.webContents.printToPDF.yields(null, '-> image data <-')

    fn({
      width: 500,
      height: 500,
      url: 'dummy'
    }, {}, (errorCode, result) => {
      t.ok(win.webContents.printToPDF.calledOnce)
      t.ok(win.close.calledOnce)
      t.equal(errorCode, null, 'code')
      t.equal(result.imgData, '-> image data <-', 'result')
      t.end()
    })
  })

  t.test('should handle printToPDF errors', t => {
    const win = createMockWindow()
    sinon.stub(remote, 'createBrowserWindow').returns(win)
    win.webContents.printToPDF.yields(new Error('printToPDF error'))

    fn({
      width: 500,
      height: 500,
      url: 'dummy'
    }, {}, (errorCode, result) => {
      t.ok(win.webContents.printToPDF.calledOnce)
      t.ok(win.close.calledOnce)
      t.equal(errorCode, 525, 'code')
      t.equal(result.msg, 'print to PDF error', 'error msg')
      t.end()
    })
  })

  t.test('should cleanup window ref if window is manually closed', t => {
    const win = createMockWindow()
    sinon.stub(remote, 'createBrowserWindow').returns(win)

    fn({
      width: 500,
      height: 500,
      url: 'dummy'
    })

    t.equal(win.listenerCount('closed'), 1)
    win.on('closed', t.end)
    win.emit('closed')
  })

  t.end()
})
