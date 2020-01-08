const fs = require('fs')
const path = require('path')
const EventEmitter = require('events')
const sinon = require('sinon')

const paths = {}
const urls = {}
const mocks = {}

paths.root = path.join(__dirname, '..')
paths.build = path.join(path.join(paths.root, 'build'))
paths.bin = path.join(paths.root, 'bin', 'orca.js')
paths.readme = path.join(paths.root, 'README.md')
paths.pkg = path.join(paths.root, 'package.json')
paths.glob = path.join(paths.root, 'src', 'util', '*')

urls.dummy = 'http://dummy.url'
urls.plotlyGraphMock = 'https://raw.githubusercontent.com/plotly/plotly.js/master/test/image/mocks/20.json'

try {
  mocks.figure = JSON.parse(fs.readFileSync(path.join(paths.build, 'test-mock.json'), 'utf-8'))
  mocks.svg = fs.readFileSync(path.join(paths.build, 'test-mock.svg'), 'utf-8')
  mocks.pdf = fs.readFileSync(path.join(paths.build, 'test-mock.pdf'))
} catch (e) {}

function createMockWindow (opts = {}) {
  const win = new EventEmitter()
  const webContents = new EventEmitter()

  webContents.executeJavaScript = sinon.stub()
  webContents.printToPDF = sinon.stub()
  webContents.sendInputEvent = sinon.stub()
  webContents.session = sinon.stub()
  webContents.session.clearStorageData = sinon.stub()

  Object.assign(win, opts, {
    webContents: webContents,
    loadURL: sinon.stub().callsFake(() => {
      webContents.emit('did-finish-load')
    }),
    close: sinon.stub().callsFake(() => {
      win.emit('closed')
    })
  })

  return win
}

function stubProp (obj, key, newVal) {
  const oldVal = obj[key]
  obj[key] = newVal
  return () => { obj[key] = oldVal }
}

module.exports = {
  paths: paths,
  urls: urls,
  mocks: mocks,
  createMockWindow: createMockWindow,
  stubProp: stubProp
}
