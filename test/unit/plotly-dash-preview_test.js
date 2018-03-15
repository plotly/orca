const tap = require('tap')
const sinon = require('sinon')

const _module = require('../../src/component/plotly-dash-preview')
const remote = require('../../src/util/remote')
const { createMockWindow } = require('../common')

tap.test('parse:', t => {
  const fn = _module.parse

  t.test('should error when no *url* field is given', t => {
    const shouldFail = ['', null, true, 1, {}]

    shouldFail.forEach(d => {
      t.test(`(case ${JSON.stringify(d)})`, t => {
        fn({url: d}, {}, (errorCode, result) => {
          t.equal(errorCode, 400, 'code')
          t.end()
        })
      })
    })

    t.end()
  })

  t.test('should default to PNG when no format specified', t => {
    fn({url: 'dummy'}, {}, (errorCode, result) => {
      t.equal(errorCode, null, 'code')
      t.equal(result.format, 'png')
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
    win.webContents.printToPDF.yields(null, '-> image data <-')
    console.log('here1')

    fn({
      width: 500,
      height: 500,
      url: 'dummy',
      format: 'pdf'
    }, {}, (errorCode, result) => {
      console.log('here2')
      t.ok(win.webContents.printToPDF.calledOnce)
      t.ok(win.close.calledOnce)
      t.equal(errorCode, null, 'code')
      t.equal(result.imgData, '-> image data <-', 'result')
      t.end()
    })

  })
  /*
  t.test('should handle printToPDF errors', t => {
    const win = createMockWindow()
    sinon.stub(remote, 'createBrowserWindow').returns(win)
    win.webContents.printToPDF.yields(new Error('printToPDF error'))

    fn({
      width: 500,
      height: 500,
      url: 'dummy',
      format: 'pdf'
    }, {}, (errorCode, result) => {
      t.ok(win.webContents.printToPDF.calledOnce)
      t.ok(win.close.calledOnce)
      t.equal(errorCode, 525, 'code')
      t.equal(result.msg, 'print to PDF error', 'error msg')
      t.end()
    })
  })
  */
  t.test('should call capturePage for PNG format', t => {
    const win = createMockWindow()
    sinon.stub(remote, 'createBrowserWindow').returns(win)
    win.webContents.capturePage.yields(null, '-> image data <-')

    fn({
      width: 500,
      height: 500,
      url: 'dummy',
      format: 'png'
    }, {}, (errorCode, result) => {
      t.ok(win.webContents.capturePage.calledOnce)
      t.ok(win.close.calledOnce)
      t.equal(errorCode, null, 'code')
      t.equal(result.imgData, '-> image data <-', 'result')
      t.end()
    })
  })

  t.test('should call capturePage when no format is specified', t => {
    const win = createMockWindow()
    sinon.stub(remote, 'createBrowserWindow').returns(win)
    win.webContents.capturePage.yields(null, '-> image data <-')

    fn({
      width: 500,
      height: 500,
      url: 'dummy'
    }, {}, (errorCode, result) => {
      t.ok(win.webContents.capturePage.calledOnce)
      t.ok(win.close.calledOnce)
      t.equal(errorCode, null, 'code')
      t.equal(result.imgData, '-> image data <-', 'result')
      t.end()
    })
  })
})
