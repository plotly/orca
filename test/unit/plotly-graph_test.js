const tap = require('tap')
const sinon = require('sinon')
const EventEmitter = require('events')

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
    const out = fn({mathjax: 'http://dummy.url'})

    t.same(out, [
      '<script src="http://dummy.url?config=TeX-AMS-MML_SVG"></script>',
      '<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>'
    ])
    t.end()
  })

  t.test('should add topojson script if given', t => {
    const out = fn({topojson: 'http://dummy.url'})

    t.same(out, [
      '<script src="http://dummy.url"></script>',
      '<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>'
    ])
    t.end()
  })

  t.test('should accept plotly.js version to be specify via semver', t => {
    const _fn = (arg, src) => {
      t.same(fn({plotlyJS: arg}), [`<script src="https://cdn.plot.ly/plotly-${src}.min.js"></script>`])
    }

    _fn('v1.20.0', '1.20.0')
    _fn('1.25.0', '1.25.0')
    _fn('latest', 'latest')
    t.end()
  })

  t.test('should accept plotly.js version to be specify via url', t => {
    const out = fn({plotlyJS: 'http://dummy.url'})

    t.same(out, ['<script src="http://dummy.url"></script>'])
    t.end()
  })

  t.test('should accept path to plotly.js bundle', t => {
    const out = fn({plotlyJS: paths.readme})

    t.match(out[0], /README.md/)
    t.end()
  })

  t.test('should throw when given plotly.js argument is invalid', t => {
    t.throws(() => fn({plotlyJS: 'not gonna work'}))
    t.end()
  })

  t.test('should throw when given mathjax argument is invalid', t => {
    t.throws(() => fn({mathjax: 'not gonna work'}))
    t.end()
  })

  t.test('should throw when given topojson argument is invalid', t => {
    t.throws(() => fn({topojson: 'not gonna work'}))
    t.end()
  })

  t.end()
})

tap.test('parse:', t => {
  const fn = _module.parse

  t.test('should fill in defaults', t => {
    const body = {
      figure: {
        data: [{y: [1, 2, 1]}]
      }
    }

    fn(body, {}, (errorCode, result) => {
      t.equal(errorCode, null, 'code')
      t.same(result, {
        figure: {
          data: [{y: [1, 2, 1]}],
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
    const shouldPass = ['png', 'webp', 'svg', 'jpeg']
    const shouldFail = ['not gonna work', 'too one too', 'jpg', 'JPEG']
    const shouldDflt = ['', null, undefined, [], {}]

    const _fn = (d, cb) => {
      const body = {
        format: d,
        figure: {data: [{y: [1, 2, 1]}]}
      }
      fn(body, {}, cb)
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
      {}, [], 123, '', {nodata: [], nolayout: {}}
    ]

    shouldFail.forEach(d => {
      t.test(`should error for ${JSON.stringify(d)}`, t => {
        fn({figure: d}, {}, (errorCode, result) => {
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
        figure: {layout: {}}
      }
      fn(body, {}, (errorCode, result) => {
        t.equal(errorCode, null, 'code')
        t.same(result.figure.data, [], 'result')
        t.end()
      })
    })

    const shouldFail = [{}, null, 2130, false, 0]

    shouldFail.forEach(d => {
      t.test(`should error for ${JSON.stringify(d)}`, t => {
        const body = {
          figure: {data: d, layout: {}}
        }
        fn(body, {}, (errorCode, result) => {
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
        figure: {data: []}
      }
      fn(body, {}, (errorCode, result) => {
        t.equal(errorCode, null, 'code')
        t.same(result.figure.layout, {}, 'result')
        t.end()
      })
    })

    const shouldFail = [[], null, 2130, false, 0]

    shouldFail.forEach(d => {
      t.test(`should error for ${JSON.stringify(d)}`, t => {
        const body = {
          figure: {data: [], layout: d}
        }
        fn(body, {}, (errorCode, result) => {
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
      const dflt = {width: 700, height: 500}[k]

      shouldPass.forEach(d => {
        t.test(`should accept ${d}`, t => {
          const body = {figure: {data: []}}
          body[k] = d

          fn(body, {}, (errorCode, result) => {
            t.equal(errorCode, null, 'code')
            t.equal(result[k], Number(d), 'result')
            t.end()
          })
        })
      })

      shouldFail.forEach(d => {
        t.test(`should fallback to layout ${k} for ${d}`, t => {
          const body = {figure: {data: [], layout: {}}}
          body[k] = d
          body.figure.layout[k] = 1000

          fn(body, {}, (errorCode, result) => {
            t.equal(errorCode, null, 'code')
            t.equal(result[k], 1000, 'result')
            t.end()
          })
        })

        t.test(`should fallback to dflt for ${d} with invalid layout ${k}`, t => {
          const body = {figure: {data: [], layout: {}}}
          body[k] = d
          body.figure.layout[k] = d

          fn(body, {}, (errorCode, result) => {
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
      data: [{y: [1, 2, 1]}],
      layout: {height: 200}
    }

    const opts = {
      format: 'svg',
      scale: 2,
      fid: 'my-graph',
      width: 1000
    }

    fn(body, opts, (errorCode, result) => {
      t.equal(errorCode, null, 'code')
      t.same(result, {
        figure: {
          data: [{y: [1, 2, 1]}],
          layout: {height: 200}
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

  t.end()
})

tap.test('convert:', t => {
  const fn = _module.convert

  t.test('should convert image data to buffer', t => {
    const formats = ['png', 'webp', 'jpeg', 'pdf']

    formats.forEach(f => {
      t.test(`for format ${f}`, t => {
        fn({imgData: 'asdfDFDASFsafadsf', format: f}, {}, (errorCode, result) => {
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

  t.test('should pass svg image data', t => {
    fn({imgData: '<svg></svg>', format: 'svg'}, {}, (errorCode, result) => {
      t.equal(errorCode, null)
      t.equal(result.head['Content-Type'], 'image/svg+xml')
      t.equal(result.body, '<svg></svg>')
      t.equal(result.bodyLength, 11)
      t.end()
    })
  })

  t.test('when *batik* option is set', t => {
    const opts = {batik: paths.batik}

    t.test('should convert svg data to pdf', t => {
      const info = {imgData: '<svg></svg>', format: 'pdf'}

      fn(info, opts, (errorCode, result) => {
        t.equal(errorCode, null)
        t.equal(result.head['Content-Type'], 'application/pdf')
        t.type(result.body, Buffer)
        t.end()
      })
    })

    t.test('should convert svg data to eps', t => {
      const info = {imgData: mocks.svg, format: 'eps'}

      fn(info, opts, (errorCode, result) => {
        t.equal(errorCode, null)
        t.equal(result.head['Content-Type'], 'application/postscript')
        t.type(result.body, Buffer)
        t.end()
      })
    })

    t.test('should pass batik errors', t => {
      const info = {imgData: '<svg></svg>', format: 'pdf'}
      opts.batik = 'not-gonna-work'

      fn(info, opts, (errorCode, result) => {
        t.equal(errorCode, 530)
        t.match(result.msg, 'image conversion error')
        t.match(result.error.message, 'Command failed')
        t.end()
      })
    })

    t.end()
  })

  t.test('should convert pdf data to eps', t => {
    const info = {imgData: mocks.pdf, format: 'eps'}

    fn(info, {}, (errorCode, result) => {
      t.equal(errorCode, null)
      t.equal(result.head['Content-Type'], 'application/postscript')
      t.type(result.body, Buffer)
      t.end()
    })
  })

  t.test('should pass pdftops errors', t => {
    const info = {imgData: mocks.pdf, format: 'eps'}
    const opts = {pdftops: 'not gonna work'}

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

  const mock130 = () => {
    Plotly.version = '1.30.0'
    Plotly.toImage = sinon.stub().returns(
      new Promise(resolve => resolve('image data'))
    )
  }

  const mock110 = () => {
    Plotly.version = '1.11.0'
    Plotly.toImage = sinon.stub().resolves(
      new Promise(resolve => resolve('image data'))
    )
    Plotly.newPlot = sinon.stub().resolves(
      new Promise(resolve => resolve({}))
    )
    Plotly.purge = sinon.stub()
  }

  const mockBrowser = () => {
    document.body = {
      appendChild: sinon.stub(),
      removeChild: sinon.stub()
    }
    document.createElement = sinon.stub()
    window.getSelection = sinon.stub().returns({selectAllChildren: sinon.stub()})
    window.decodeURIComponent = sinon.stub().returns('decoded image data')
  }

  const mockElements = () => {
    const div = {appendChild: sinon.stub()}
    document.createElement.withArgs('div').returns(div)

    const img = new EventEmitter()
    document.createElement.withArgs('img').returns(img)
    img.addEventListener = img.addListener

    return {
      div: div,
      img: img
    }
  }

  const mockWindow = () => {
    const win = createMockWindow()
    sinon.stub(remote, 'getCurrentWindow').returns(win)

    return {
      win: win,
      restore: () => remote.getCurrentWindow.restore()
    }
  }

  t.test('v1.30.0 and up', t => {
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
      const {img} = mockElements()
      const {win, restore} = mockWindow()
      win.webContents.printToPDF.yields(null, 'pdf data')

      fn({format: 'pdf'}, {}, (errorCode, result) => {
        t.equal(errorCode, null)
        t.equal(result.imgData, 'pdf data')
        t.equal(document.createElement.callCount, 2, 'createElement calls')
        t.equal(document.body.appendChild.callCount, 1, 'body.appendChild calls')
        t.equal(document.body.removeChild.callCount, 1, 'body.removeChild calls')

        restore()
        t.end()
      })
      setTimeout(() => img.emit('load'))
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

    t.test('(format svg)', t => {
      mock110()
      mockBrowser()

      fn({format: 'svg'}, {}, (errorCode, result) => {
        t.equal(result.imgData, 'decoded image data')
        t.ok(document.createElement.calledOnce)
        t.ok(Plotly.newPlot.calledOnce)
        t.ok(Plotly.toImage.calledOnce)
        t.ok(Plotly.purge.calledOnce)
        t.end()
      })
    })

    t.test('(format pdf)', t => {
      mock110()
      mockBrowser()
      const {img} = mockElements()
      const {win, restore} = mockWindow()
      win.webContents.printToPDF.yields(null, 'pdf data')

      fn({format: 'pdf'}, {}, (errorCode, result) => {
        t.equal(errorCode, null)
        t.equal(result.imgData, 'pdf data')
        t.equal(document.createElement.callCount, 3, 'createElement calls')
        t.equal(document.body.appendChild.callCount, 1, 'body.appendChild calls')
        t.equal(document.body.removeChild.callCount, 1, 'body.removeChild calls')

        restore()
        t.end()
      })
      setTimeout(() => img.emit('load'))
    })

    t.test('(format pdf with batik support)', t => {
      mock110()
      mockBrowser()
      const {img} = mockElements()
      const {win, restore} = mockWindow()
      win.webContents.printToPDF.yields(null, 'pdf data')

      fn({format: 'pdf'}, {batik: 'path-to-batik'}, (errorCode, result) => {
        t.equal(errorCode, null)
        t.equal(result.imgData, 'decoded image data')

        restore()
        t.end()
      })
      setTimeout(() => img.emit('load'))
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

  t.test('should return error code on printToPDF errors', t => {
    mock130()
    mockBrowser()
    const {img} = mockElements()
    const {win, restore} = mockWindow()
    win.webContents.printToPDF.yields(new Error('oops'))

    fn({format: 'pdf'}, {}, (errorCode, result) => {
      t.equal(errorCode, 525)
      t.match(result.error, /electron print to PDF error/, 'error')
      t.ok(document.body.removeChild.calledOnce)

      restore()
      t.end()
    })
    setTimeout(() => img.emit('load'))
  })

  t.test('should return error code on createElement(\'img\') errors', t => {
    mock130()
    mockBrowser()
    const {img} = mockElements()
    const {restore} = mockWindow()

    fn({format: 'pdf'}, {}, (errorCode, result) => {
      t.equal(errorCode, 525)
      t.match(result.error, /image failed to load/, 'error')
      t.ok(document.body.removeChild.calledOnce)

      restore()
      t.end()
    })
    setTimeout(() => img.emit('error'))
  })

  t.test('should generate svg for format pdf and eps', t => {
    const formats = ['pdf', 'eps']

    formats.forEach(f => {
      t.test(`(format ${f})`, t => {
        mock130()
        fn({format: f}, {}, () => {
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

    fn({format: 'jpeg'}, {}, () => {
      t.ok(Plotly.toImage.calledOnce)
      t.equal(Plotly.toImage.args[0][1].setBackground, 'opaque')
      t.end()
    })
  })

  t.end()
})
