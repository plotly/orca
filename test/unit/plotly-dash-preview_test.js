const tap = require('tap')
const sinon = require('sinon')

const _module = require('../../src/component/plotly-dash-preview')
const constants = require('../../src/component/plotly-dash-preview/constants')
const remote = require('../../src/util/remote')
const { createMockWindow } = require('../common')

tap.test('parse:', t => {
  const fn = _module.parse

  t.test('should error when invalid *url* field is given', t => {
    const shouldFail = ['', null, true, 1, {}, 'dummy']

    shouldFail.forEach(d => {
      t.test(`(case ${JSON.stringify(d)})`, t => {
        fn({ url: d }, {}, {}, (errorCode, result) => {
          t.equal(errorCode, 400)
          t.same(result, { 'msg': 'invalid url' })
          t.end()
        })
      })
    })

    t.end()
  })
  t.test('should error when neither loading_selector or timeout is given', t => {
    fn({ url: 'https://dash-app.com' }, {}, {}, (errorCode, result) => {
      t.equal(errorCode, 400)
      t.equal(result.msg, 'either selector or timeout must be specified')
      t.end()
    })
  })
  t.test('pageSize options:', t => {
    const mock = () => ({
      url: 'https://dash-app.com',
      selector: 'dummy'
    })

    t.test('should error when not given', t => {
      fn(mock(), {}, {}, (errorCode, result) => {
        t.equal(errorCode, 400)
        t.same(result.msg, 'pageSize must either be A3, A4, A5, Legal, Letter, ' +
                           'Tabloid or an Object containing height and width in microns.')
        t.end()
      })
    })

    function assertEqualSize (browserSize, pageSize, landscape) {
      // Browser size is always integer pixels
      var bW = browserSize.width
      var bH = browserSize.height
      t.ok(Number.isInteger(bW), 'browserSize.width is not an integer')
      t.ok(Number.isInteger(bH), 'browserSize.height is not an integer')
      var pW, pH
      if (constants.sizeMapping[pageSize]) {
        var equivalentPixelSize = constants.sizeMapping[pageSize]
        pW = equivalentPixelSize.width
        pH = equivalentPixelSize.height
      } else {
        pW = pageSize.width * constants.pixelsInMicron
        pH = pageSize.height * constants.pixelsInMicron
      }
      // Round
      pW = Math.ceil(pW)
      pH = Math.ceil(pH)
      t.equal(bW, landscape ? pH : pW, 'browser and page should have the same width')
      t.equal(bH, landscape ? pW : pH, 'browser and page should have the same height')
    }

    // Browser size and page size should be the same assuming a DPI of 96
    // to make sure plotly.js figures are appropriately sized right away for print
    [
      // [pageSize defined at top-level?, pageSize, landscape?]
      [true, { height: 1000, width: 1000 }],
      [true, 'Letter'],
      [false, { height: 1000, width: 1000 }],
      [false, 'Letter'],
      [true, { height: 1000, width: 1000 }, true],
      [true, 'Letter', true],
      [false, { height: 1000, width: 1000 }, true],
      [false, 'Letter', true]
    ].forEach(arg => {
      var toplevel = arg[0]
      var pageSize = arg[1]
      var landscape = arg[2]
      t.test(`should size window and page properly when ${toplevel ? '' : 'pdf_options.'}pageSize is given`, t => {
        var body = mock()
        if (toplevel) {
          body.pageSize = pageSize
          body.pdf_options = {}
        } else {
          body.pdf_options = { pageSize: pageSize }
        }
        if (landscape) body.pdf_options.landscape = landscape
        fn(body, {}, {}, (errorCode, result) => {
          t.equal(errorCode, null)
          t.same(result.pdfOptions.pageSize, pageSize)
          assertEqualSize(result.browserSize, result.pdfOptions.pageSize, landscape)
          t.end()
        })
      })
    })

    t.test('pdf_options.pageSize overrides top-level pageSize', t => {
      var body = mock()
      body.pageSize = { height: 1000, width: 1000 }
      body.pdf_options = { pageSize: { height: 2000, width: 2000 } }
      fn(body, {}, {}, (errorCode, result) => {
        t.equal(errorCode, null)
        t.same(result.browserSize, { height: 8, width: 8 })
        t.end()
      })
    })

    t.test('should passthrough pdf_options', t => {
      var body = mock()
      body.pdf_options = { pageSize: 'Letter', marginsType: 1, crazyOptions: true }
      fn(body, {}, {}, (errorCode, result) => {
        t.equal(errorCode, null)
        t.same(result.pdfOptions, { pageSize: 'Letter', marginsType: 1, crazyOptions: true })
        t.end()
      })
    })
    t.end()
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

  t.test('should clear session cookies before loading dash-app', t => {
    const win = createMockWindow()
    sinon.stub(remote, 'createBrowserWindow').returns(win)
    win.webContents.executeJavaScript.resolves(true)
    win.webContents.printToPDF.yields(null, '-> image data <-')

    fn({
      url: 'https://dummy.com'
    }, {}, (errorCode, result) => {
      t.ok(win.webContents.session.clearStorageData.calledOnce)
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
      t.equal(errorCode, 526, 'code')
      t.same(result, { 'msg': 'dash preview generation timed out' }, 'result')
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

  t.test('should handle pages with iframes', t => {
    // https://github.com/electron/electron/issues/20634
    const win = createMockWindow()
    sinon.stub(remote, 'createBrowserWindow').returns(win)
    win.webContents.executeJavaScript.resolves(true)

    fn({
      url: 'https://stackoverflow.com/questions/909018/avoiding-initial-memory-heap-size-error',
      timeOut: 1
    }, {}, (errorCode, result) => {
      t.ok(win.webContents.printToPDF.calledOnce)
      t.ok(win.close.calledOnce)
      t.equal(errorCode, 527, 'code')
      t.equal(result.msg, 'dash preview pdf generation timed out', 'error msg')
      t.end()
    })
  })

  t.end()
})
