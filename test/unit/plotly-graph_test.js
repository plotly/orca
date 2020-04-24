const tap = require('tap')
const sinon = require('sinon')
const Pdftops = require('../../src/util/pdftops')

const _module = require('../../src/component/plotly-graph')
const remote = require('../../src/util/remote')
const { paths, mocks, createMockWindow } = require('../common')

tap.test('inject:', t => {
  const fn = _module.inject

  t.test('should fill in defaults', t => {
    const out = fn()

    t.same(out, ['<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>'])
    t.end()
  })

  t.test('should add mathjax script if given with config options', t => {
    const out = fn({ mathjax: 'http://dummy.url' })

    t.same(out, [
      '<script src="http://dummy.url?config=TeX-AMS-MML_SVG"></script>',
      '<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>'
    ])
    t.end()
  })

  t.test('should add topojson script if given', t => {
    const out = fn({ topojson: 'http://dummy.url' })

    t.same(out, [
      '<script src="http://dummy.url"></script>',
      '<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>'
    ])
    t.end()
  })

  t.test('should accept plotly.js version to be specify via semver', t => {
    const _fn = (arg, src) => {
      t.same(fn({ plotlyJS: arg }), [`<script src="https://cdn.plot.ly/plotly-${src}.min.js"></script>`])
    }

    _fn('v1.20.0', '1.20.0')
    _fn('1.25.0', '1.25.0')
    _fn('latest', 'latest')
    t.end()
  })

  t.test('should accept plotly.js version to be specify via url', t => {
    const out = fn({ plotlyJS: 'http://dummy.url' })

    t.same(out, ['<script src="http://dummy.url"></script>'])
    t.end()
  })

  t.test('should accept path to plotly.js bundle', t => {
    const out = fn({ plotlyJS: paths.readme })

    t.match(out[0], /README.md/)
    t.end()
  })

  t.test('should throw when given plotly.js argument is invalid', t => {
    t.throws(() => fn({ plotlyJS: 'not gonna work' }))
    t.end()
  })

  t.test('should throw when given mathjax argument is invalid', t => {
    t.throws(() => fn({ mathjax: 'not gonna work' }))
    t.end()
  })

  t.test('should throw when given topojson argument is invalid', t => {
    t.throws(() => fn({ topojson: 'not gonna work' }))
    t.end()
  })

  t.end()
})

tap.test('parse:', t => {
  const fn = _module.parse

  t.test('should fill in defaults', t => {
    const body = {
      figure: {
        data: [{ y: [1, 2, 1] }]
      }
    }

    fn(body, {}, {}, (errorCode, result) => {
      t.equal(errorCode, null, 'code')
      t.same(result, {
        figure: {
          data: [{ y: [1, 2, 1] }],
          layout: {}
        },
        format: 'png',
        scale: 1,
        width: 700,
        height: 500,
        encoded: false,
        fid: null
      }, 'result')

      t.end()
    })
  })

  t.test('parsing *format*', t => {
    const shouldPass = ['png', 'webp', 'svg', 'jpeg', 'json']
    const shouldFail = ['not gonna work', 'too one too', 'jpg', 'JPEG']
    const shouldDflt = ['', null, undefined, [], {}]

    const _fn = (d, cb) => {
      const body = {
        format: d,
        figure: { data: [{ y: [1, 2, 1] }] }
      }
      fn(body, {}, {}, cb)
    }

    shouldPass.forEach(d => {
      t.test(`should accept ${d}`, t => {
        _fn(d, (errorCode, result) => {
          t.equal(errorCode, null, 'code')
          t.equal(result.format, d, 'format')
          t.end()
        })
      })
    })

    shouldFail.forEach(d => {
      t.test(`should error for ${d}`, t => {
        _fn(d, (errorCode, result) => {
          t.equal(errorCode, 400, 'code')
          t.equal(result.msg, 'invalid or malformed request syntax (wrong format)', 'msg')
          t.end()
        })
      })
    })

    shouldDflt.forEach(d => {
      t.test(`should fallback to default for ${d}`, t => {
        _fn(d, (errorCode, result) => {
          t.equal(errorCode, null, 'code')
          t.equal(result.format, 'png', 'format')
          t.end()
        })
      })
    })

    t.end()
  })

  t.test('parsing *figure*', t => {
    const shouldFail = [
      {}, [], 123, '', { nodata: [], nolayout: {} }
    ]

    shouldFail.forEach(d => {
      t.test(`should error for ${JSON.stringify(d)}`, t => {
        fn({ figure: d }, {}, {}, (errorCode, result) => {
          t.equal(errorCode, 400)
          t.end()
        })
      })
    })

    t.end()
  })

  t.test('parsing *data*', t => {
    t.test('should default to empty array if not set', t => {
      const body = {
        figure: { layout: {} }
      }
      fn(body, {}, {}, (errorCode, result) => {
        t.equal(errorCode, null, 'code')
        t.same(result.figure.data, [], 'result')
        t.end()
      })
    })

    const shouldFail = [{}, null, 2130, false, 0]

    shouldFail.forEach(d => {
      t.test(`should error for ${JSON.stringify(d)}`, t => {
        const body = {
          figure: { data: d, layout: {} }
        }
        fn(body, {}, {}, (errorCode, result) => {
          t.equal(errorCode, 400, 'code')
          t.equal(result.msg, 'invalid or malformed request syntax (non-array figure data)', 'msg')
          t.end()
        })
      })
    })

    t.end()
  })

  t.test('parsing *layout*', t => {
    t.test('should default to empty object if not set', t => {
      const body = {
        figure: { data: [] }
      }
      fn(body, {}, {}, (errorCode, result) => {
        t.equal(errorCode, null, 'code')
        t.same(result.figure.layout, {}, 'result')
        t.end()
      })
    })

    const shouldFail = [[], null, 2130, false, 0]

    shouldFail.forEach(d => {
      t.test(`should error for ${JSON.stringify(d)}`, t => {
        const body = {
          figure: { data: [], layout: d }
        }
        fn(body, {}, {}, (errorCode, result) => {
          t.equal(errorCode, 400, 'code')
          t.equal(result.msg, 'invalid or malformed request syntax (non-object figure layout)', 'msg')
          t.end()
        })
      })
    })

    t.end()
  })

  t.test('parsing *width* and *height*', t => {
    const keys = ['width', 'height']
    const shouldPass = [200, 130, '40']
    const shouldFail = [undefined, '', -12, null, false]

    keys.forEach(k => {
      const dflt = { width: 700, height: 500 }[k]

      shouldPass.forEach(d => {
        t.test(`should accept ${d}`, t => {
          const body = { figure: { data: [] } }
          body[k] = d

          fn(body, {}, {}, (errorCode, result) => {
            t.equal(errorCode, null, 'code')
            t.equal(result[k], Number(d), 'result')
            t.end()
          })
        })
      })

      shouldPass.forEach(d => {
        t.test(`should fallback to dflt for ${d} with autosize turned on`, t => {
          const body = { figure: { data: [], layout: { autosize: true } } }
          body.figure.layout[k] = d

          fn(body, {}, {}, (errorCode, result) => {
            t.equal(errorCode, null, 'code')
            t.equal(result[k], dflt, 'result')
            t.end()
          })
        })
      })

      shouldFail.forEach(d => {
        t.test(`should fallback to layout ${k} for ${d}`, t => {
          const body = { figure: { data: [], layout: {} } }
          body[k] = d
          body.figure.layout[k] = 1000

          fn(body, {}, {}, (errorCode, result) => {
            t.equal(errorCode, null, 'code')
            t.equal(result[k], 1000, 'result')
            t.end()
          })
        })

        t.test(`should fallback to dflt for ${d} with invalid layout ${k}`, t => {
          const body = { figure: { data: [], layout: {} } }
          body[k] = d
          body.figure.layout[k] = d

          fn(body, {}, {}, (errorCode, result) => {
            t.equal(errorCode, null, 'code')
            t.equal(result[k], dflt, 'result')
            t.end()
          })
        })
      })
    })

    t.end()
  })

  t.test('should work with component options too', t => {
    const body = {
      data: [{ y: [1, 2, 1] }],
      layout: { height: 200 }
    }

    const opts = {
      format: 'svg',
      scale: 2,
      fid: 'my-graph',
      width: 1000
    }

    fn(body, {}, opts, (errorCode, result) => {
      t.equal(errorCode, null, 'code')
      t.same(result, {
        figure: {
          data: [{ y: [1, 2, 1] }],
          layout: { height: 200 }
        },
        format: 'svg',
        scale: 2,
        width: 1000,
        height: 200,
        encoded: false,
        fid: 'my-graph'
      }, 'result')
      t.end()
    })
  })

  t.test('should not access figures that a likely to make renderer hang under *safeMode*', t => {
    t.test('failing svg scatter case', t => {
      var x = new Array(1e6)

      fn({
        data: [{
          type: 'scatter',
          x: x
        }]
      }, {}, { safeMode: true }, (errorCode, result) => {
        t.equal(errorCode, 400, 'code')
        t.type(result.msg, 'string', 'msg type')
        t.end()
      })
    })

    t.test('passing scattergl case', t => {
      var x = new Array(1e6)

      fn({
        data: [{
          type: 'scattergl',
          x: x
        }]
      }, {}, { safeMode: true }, (errorCode, result) => {
        t.equal(errorCode, null, 'code')
        t.type(result.figure, 'object', 'figure type')
        t.end()
      })
    })

    t.test('failing parcoords case', t => {
      var x = new Array(3e5)

      fn({
        data: [{
          type: 'parcoords',
          dimensions: [{
            values: x
          }, {
            values: x
          }]
        }]
      }, {}, { safeMode: true }, (errorCode, result) => {
        t.equal(errorCode, 400, 'code')
        t.type(result.msg, 'string', 'msg type')
        t.end()
      })
    })

    t.test('failing heatmap case', t => {
      var z = [
        new Array(5e5),
        new Array(5e5),
        new Array(5e5)
      ]

      fn({
        data: [{
          type: 'heatmap',
          z: z
        }]
      }, {}, { safeMode: true }, (errorCode, result) => {
        t.equal(errorCode, 400, 'code')
        t.type(result.msg, 'string', 'msg type')
        t.end()
      })
    })

    t.test('failing table case', t => {
      fn({
        data: [{
          type: 'table',
          cells: {
            values: [
              new Array(5e6),
              new Array(5e6),
              new Array(5e6)
            ]
          }
        }]
      }, {}, { safeMode: true }, (errorCode, result) => {
        t.equal(errorCode, 400, 'code')
        t.type(result.msg, 'string', 'msg type')
        t.end()
      })
    })

    t.test('failing case from too many traces', t => {
      var data = new Array(3e3)

      fn({
        data: data
      }, {}, { safeMode: true }, (errorCode, result) => {
        t.equal(errorCode, 400, 'code')
        t.type(result.msg, 'string', 'msg type')
        t.end()
      })
    })

    t.test('failing edge case (box with boxpoints all)', t => {
      fn({
        data: [{
          type: 'box',
          x: new Array(1e5),
          boxpoints: 'all'
        }]
      }, {}, { safeMode: true }, (errorCode, result) => {
        t.equal(errorCode, 400, 'code')
        t.type(result.msg, 'string', 'msg type')
        t.end()
      })
    })

    t.test('failing edge case (violin with points all)', t => {
      fn({
        data: [{
          type: 'violin',
          x: new Array(1e5),
          points: 'all'
        }]
      }, {}, { safeMode: true }, (errorCode, result) => {
        t.equal(errorCode, 400, 'code')
        t.type(result.msg, 'string', 'msg type')
        t.end()
      })
    })

    t.test('failing edge case (mesh3d and alphahull)', t => {
      var data = new Array(2e3)

      fn({
        data: [{
          type: 'mesh3d',
          x: data,
          alphahull: 1
        }]
      }, {}, { safeMode: true }, (errorCode, result) => {
        t.equal(errorCode, 400, 'code')
        t.type(result.msg, 'string', 'msg type')
        t.end()
      })
    })

    t.test('failing case from too many traces', t => {
      var data = new Array(3e3)

      fn({
        data: data
      }, {}, { safeMode: true }, (errorCode, result) => {
        t.equal(errorCode, 400, 'code')
        t.type(result.msg, 'string', 'msg type')
        t.end()
      })
    })

    t.test('failing edge case (to test budget)', t => {
      fn({
        data: [{
          type: 'scatter',
          x: new Array(4e4) // below 5e4 threshold
        }, {
          type: 'heatmap',
          z: [
            new Array(5e5), // below 5e4 threshold
            new Array(4e5)
          ]
        }]
      }, {}, { safeMode: true }, (errorCode, result) => {
        t.equal(errorCode, 400, 'code')
        t.type(result.msg, 'string', 'msg type')
        t.end()
      })
    })

    t.test('failing edge case (to test budget of edge cases)', t => {
      fn({
        data: [{
          type: 'violin',
          points: 'all',
          x: new Array(4e4) // below 5e4 threshold
        }, {
          type: 'box',
          boxpoints: 'all',
          x: new Array(4e4) // below 5e4 threshold
        }]
      }, {}, { safeMode: true }, (errorCode, result) => {
        t.equal(errorCode, 400, 'code')
        t.type(result.msg, 'string', 'msg type')
        t.end()
      })
    })

    t.test('failing case (with no arrays in starting trace)', t => {
      fn({
        data: [{}, {}, {
          type: 'scatter',
          x: new Array(1e6)
        }]
      }, {}, { safeMode: true }, (errorCode, result) => {
        t.equal(errorCode, 400, 'code')
        t.type(result.msg, 'string', 'msg type')
        t.end()
      })
    })

    t.end()
  })

  t.end()
})

tap.test('convert:', t => {
  const fn = _module.convert

  t.test('should convert image data to buffer', t => {
    const formats = ['png', 'webp', 'jpeg', 'pdf']

    formats.forEach(f => {
      t.test(`for format ${f}`, t => {
        fn({ imgData: 'asdfDFDASFsafadsf', format: f }, {}, (errorCode, result) => {
          t.equal(errorCode, null)
          t.match(result.head['Content-Type'], f)
          t.type(result.body, Buffer)
          t.type(result.bodyLength, 'number')
          t.end()
        })
      })
    })

    t.end()
  })

  t.test('should pass image data when encoded option is turned on', t => {
    const formats = ['png', 'webp', 'jpeg']

    formats.forEach(f => {
      t.test(`for format ${f}`, t => {
        fn({ imgData: 'asdfDFDASFsafadsf', format: f, encoded: true }, {}, (errorCode, result) => {
          t.equal(errorCode, null)
          t.match(result.head['Content-Type'], f)
          t.type(result.body, 'asdfDFDASFsafadsf')
          t.type(result.bodyLength, 'number')
          t.end()
        })
      })
    })

    t.test('for format pdf', t => {
      fn({ imgData: 'asdfDFDASFsafadsf', format: 'pdf', encoded: true }, {}, (errorCode, result) => {
        t.equal(errorCode, null)
        t.match(result.head['Content-Type'], 'pdf')
        t.type(result.body, 'data:application/pdf;base64,asdfDFDASFsafadsf')
        t.type(result.bodyLength, 'number')
        t.end()
      })
    })

    t.end()
  })

  t.test('should pass svg image data', t => {
    fn({ imgData: '<svg></svg>', format: 'svg' }, {}, (errorCode, result) => {
      t.equal(errorCode, null)
      t.equal(result.head['Content-Type'], 'image/svg+xml')
      t.equal(result.body, '<svg></svg>')
      t.equal(result.bodyLength, 11)
      t.end()
    })
  })

  t.test('should convert pdf data to eps', t => {
    const info = { imgData: mocks.pdf, format: 'eps' }

    t.test('(encoded false)', t => {
      fn(info, {}, (errorCode, result) => {
        t.equal(errorCode, null)
        t.equal(result.head['Content-Type'], 'application/postscript')
        t.type(result.body, Buffer)
        t.end()
      })
    })

    t.test('(encoded true)', t => {
      fn(Object.assign({}, info, { encoded: true }), {}, (errorCode, result) => {
        t.equal(errorCode, null)
        t.equal(result.head['Content-Type'], 'application/postscript')
        t.match(result.body, /^data:application\/postscript;base64,/)
        t.end()
      })
    })

    t.end()
  })

  t.test('should convert pdf data to eps (while passing instance of Pdftops)', t => {
    const info = { imgData: mocks.pdf, format: 'eps' }
    const opts = { pdftops: new Pdftops() }

    fn(info, opts, (errorCode, result) => {
      t.equal(errorCode, null)
      t.equal(result.head['Content-Type'], 'application/postscript')
      t.type(result.body, Buffer)
      t.end()
    })
  })

  t.test('should pass pdftops errors', t => {
    const info = { imgData: mocks.pdf, format: 'eps' }
    const opts = { pdftops: 'not gonna work' }

    fn(info, opts, (errorCode, result) => {
      t.equal(errorCode, 530)
      t.match(result.msg, 'image conversion error')
      t.match(result.error.message, 'Command failed')
      t.end()
    })
  })

  t.end()
})

tap.test('render:', t => {
  const fn = (info, opts, cb) => {
    const baseInfo = {
      format: 'png',
      figure: { data: [{ y: [1, 2, 1] }] }
    }
    _module.render(Object.assign({}, baseInfo, info), opts, cb)
  }

  let Plotly
  let document
  let window

  t.beforeEach((done) => {
    global.Plotly = Plotly = {}
    global.document = document = {}
    global.window = window = {}
    done()
  })

  t.afterEach((done) => {
    delete global.Plotly
    delete global.document
    delete global.window
    done()
  })

  const mock153 = () => {
    Plotly.version = '1.53.0'
    Plotly.toImage = sinon.stub().returns(
      new Promise(resolve => resolve('image data'))
    )
  }

  const mock130 = () => {
    Plotly.version = '1.30.0'
    Plotly.toImage = sinon.stub().returns(
      new Promise(resolve => resolve('image data'))
    )
  }

  const mock110 = () => {
    Plotly.version = '1.11.0'
    Plotly.toImage = sinon.stub().resolves(
      new Promise(resolve => resolve('data:image/yo;base64,image data'))
    )
    Plotly.newPlot = sinon.stub().resolves(
      new Promise(resolve => resolve({}))
    )
    Plotly.purge = sinon.stub()
  }

  const mockBrowser = () => {
    document.createElement = sinon.stub()
    window.decodeURIComponent = sinon.stub().returns('decoded image data')
    window.encodeURIComponent = sinon.stub().returns('encoded image data')
  }

  const mockWindow = () => {
    const win = createMockWindow()
    sinon.stub(remote, 'createBrowserWindow').returns(win)
    return {
      win: win,
      restore: () => remote.createBrowserWindow.restore()
    }
  }

  t.test('v1.53.0 and up', t => {
    t.test('format json', t => {
      mock153()

      fn({ format: 'json' }, {}, (errorCode, result) => {
        t.equal(errorCode, null)
        t.equal(result.imgData, 'image data')
        t.end()
      })
    })
    t.end()
  })

  t.test('v1.30.0 <= versions < 1.53.0', t => {
    t.test('(format png)', t => {
      mock130()

      fn({}, {}, (errorCode, result) => {
        t.equal(result.imgData, 'image data')
        t.ok(Plotly.toImage.calledOnce)
        t.end()
      })
    })

    t.test('(format pdf)', t => {
      mock130()
      mockBrowser()
      const { win, restore } = mockWindow()
      win.webContents.executeJavaScript.returns(new Promise(resolve => resolve()))
      win.webContents.printToPDF.returns(Promise.resolve('pdf data'))

      fn({ format: 'pdf' }, {}, (errorCode, result) => {
        t.equal(errorCode, null)
        t.equal(result.imgData, 'pdf data')
        t.equal(window.encodeURIComponent.callCount, 1, 'encodeURIComponent calls')
        t.equal(win.webContents.executeJavaScript.callCount, 1, 'executeJavaScript calls')
        t.equal(win.webContents.printToPDF.callCount, 1, 'printToPDF calls')
        t.ok(win.close.calledOnce)

        restore()
        t.end()
      })
    })

    t.test('format json', t => {
      mock130()

      fn({ format: 'json' }, {}, (errorCode, result) => {
        t.equal(errorCode, 527)
        t.end()
      })
    })

    t.end()
  })

  t.test('v1.11.0 <= versions < v1.30.0', t => {
    t.test('(format png)', t => {
      mock110()
      mockBrowser()

      fn({}, {}, (errorCode, result) => {
        t.equal(result.imgData, 'image data')
        t.ok(document.createElement.calledOnce)
        t.ok(Plotly.newPlot.calledOnce)
        t.ok(Plotly.toImage.calledOnce)
        t.ok(Plotly.purge.calledOnce)
        t.end()
      })
    })

    t.test('(format png encoded)', t => {
      mock110()
      mockBrowser()

      fn({ encoded: true }, {}, (errorCode, result) => {
        t.equal(result.imgData, 'data:image/yo;base64,image data')
        t.ok(document.createElement.calledOnce)
        t.ok(Plotly.newPlot.calledOnce)
        t.ok(Plotly.toImage.calledOnce)
        t.ok(Plotly.purge.calledOnce)
        t.end()
      })
    })

    t.test('(format svg)', t => {
      mock110()
      mockBrowser()

      fn({ format: 'svg' }, {}, (errorCode, result) => {
        t.equal(result.imgData, 'decoded image data')
        t.ok(document.createElement.calledOnce)
        t.ok(window.decodeURIComponent.calledOnce)
        t.ok(Plotly.newPlot.calledOnce)
        t.ok(Plotly.toImage.calledOnce)
        t.ok(Plotly.purge.calledOnce)
        t.end()
      })
    })

    t.test('(format svg encoded)', t => {
      mock110()
      mockBrowser()

      fn({ format: 'svg', encoded: true }, {}, (errorCode, result) => {
        t.equal(result.imgData, 'data:image/yo;base64,image data')
        t.ok(document.createElement.calledOnce)
        t.ok(window.decodeURIComponent.notCalled)
        t.ok(Plotly.newPlot.calledOnce)
        t.ok(Plotly.toImage.calledOnce)
        t.ok(Plotly.purge.calledOnce)
        t.end()
      })
    })

    t.test('(format pdf)', t => {
      mock110()
      mockBrowser()
      const { win, restore } = mockWindow()
      win.webContents.executeJavaScript.returns(new Promise(resolve => resolve()))
      win.webContents.printToPDF.returns(Promise.resolve('pdf data'))

      fn({ format: 'pdf' }, {}, (errorCode, result) => {
        t.equal(errorCode, null)
        t.equal(result.imgData, 'pdf data')
        t.equal(document.createElement.callCount, 1, 'createElement calls')
        t.equal(window.encodeURIComponent.callCount, 1, 'encodeURIComponent calls')
        t.equal(win.webContents.executeJavaScript.callCount, 1, 'executeJavaScript calls')
        t.equal(win.webContents.printToPDF.callCount, 1, 'printToPDF calls')
        t.doesNotThrow(() => {
          const gd = {
            _fullLayout: { paper_bgcolor: 'some color' }
          }
          Plotly.toImage.args[0][1].setBackground(gd, 'some other color')
        }, 'custom setBackground function')

        restore()
        t.end()
      })
    })

    t.end()
  })

  t.test('other versions should return error code', t => {
    Plotly.version = '1.1.0'

    fn({}, {}, (errorCode) => {
      t.equal(errorCode, 526)
      t.end()
    })
  })

  t.test('should return error code on plotly.js errors', t => {
    Plotly.version = '1.30.0'
    Plotly.toImage = sinon.stub().returns(new Promise((resolve, reject) => {
      reject(new Error('oops'))
    }))

    fn({}, {}, (errorCode) => {
      t.equal(errorCode, 525)
      t.end()
    })
  })

  t.test('should return error code on executeJavaScript errors', t => {
    mock130()
    mockBrowser()
    const { win, restore } = mockWindow()
    win.webContents.executeJavaScript.returns(new Promise((resolve, reject) => {
      reject(new Error('oh no!'))
    }))

    fn({ format: 'pdf' }, {}, (errorCode, result) => {
      t.equal(errorCode, 525)
      t.match(result.error, /oh no/, 'error')
      t.ok(win.close.calledOnce)

      restore()
      t.end()
    })
  })

  t.test('should return error code on printToPDF errors', t => {
    mock130()
    mockBrowser()
    const { win, restore } = mockWindow()
    win.webContents.executeJavaScript.returns(new Promise(resolve => resolve()))
    win.webContents.printToPDF.returns(Promise.reject(new Error('oops')))

    fn({ format: 'pdf' }, {}, (errorCode, result) => {
      t.equal(errorCode, 525)
      t.match(result.error, /oops/, 'error')
      t.ok(win.close.calledOnce)

      restore()
      t.end()
    })
  })

  t.test('should generate svg for format pdf and eps', t => {
    const formats = ['pdf', 'eps']

    formats.forEach(f => {
      t.test(`(format ${f})`, t => {
        mock130()
        fn({ format: f }, {}, () => {
          t.ok(Plotly.toImage.calledOnce)
          t.equal(Plotly.toImage.args[0][1].format, 'svg')
          t.end()
        })
      })
    })

    t.end()
  })

  t.test('should set setBackground to opaque for jpeg format', t => {
    mock130()

    fn({ format: 'jpeg' }, {}, () => {
      t.ok(Plotly.toImage.calledOnce)
      t.equal(Plotly.toImage.args[0][1].setBackground, 'opaque')
      t.end()
    })
  })

  t.test('should pass mapboxAccessToken as config option (string case)', t => {
    mock130()

    const token = '312dsadsa1321'

    fn({}, { mapboxAccessToken: token }, () => {
      t.ok(Plotly.toImage.calledOnce)
      t.equal(Plotly.toImage.args[0][0].config.mapboxAccessToken, token)
      t.end()
    })
  })

  t.test('should pass mapboxAccessToken as config option (empty case)', t => {
    mock130()

    fn({}, { mapboxAccessToken: '' }, () => {
      t.ok(Plotly.toImage.calledOnce)
      t.equal(Plotly.toImage.args[0][0].config.mapboxAccessToken, null)
      t.end()
    })
  })

  t.end()
})
