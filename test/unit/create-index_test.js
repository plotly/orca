const tap = require('tap')
const fs = require('fs')

const createIndex = require('../../src/util/create-index')
const coerceComponent = require('../../src/util/coerce-component')

const fn = (_comp, opts, cb) => {
  createIndex(coerceComponent(_comp), opts, cb)
}

tap.test('should create index object', t => {
  fn('plotly-graph', {}, (index) => {
    t.type(index.path, 'string')
    t.type(index.destroy, 'function')

    t.ok(fs.existsSync(index.path), 'index file should exist')
    index.destroy()
    t.notOk(fs.existsSync(index.path), 'index file should not exist')
    t.end()
  })
})
