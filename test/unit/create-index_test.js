const tap = require('tap')
const sinon = require('sinon')
const fs = require('fs')

const createIndex = require('../../src/util/create-index')
const coerceComponent = require('../../src/util/coerce-component')

tap.test('should create index object', t => {
  createIndex(coerceComponent('plotly-graph'), {}, (index) => {
    t.type(index.path, 'string')
    t.type(index.destroy, 'function')

    t.ok(fs.existsSync(index.path), 'index file should exist')
    index.destroy()
    t.notOk(fs.existsSync(index.path), 'index file should not exist')
    t.end()
  })
})

tap.test('should inject correct head content', t => {
  const fn = (t, inject, line) => {
    const comp = coerceComponent('plotly-graph')
    comp._module.inject = inject

    createIndex(comp, {}, (index) => {
      const lines = fs.readFileSync(index.path).toString().split('\n')
      t.equal(lines[5], line)
      index.destroy()
      t.end()
    })
  }

  t.test('(blank case)', t => {
    fn(t, () => {}, '      ')
  })

  t.test('(string case)', t => {
    fn(t, () => 'a', '      a')
  })

  t.test('(array case)', t => {
    fn(t, () => ['a', 'b'], '      a')
  })

  t.end()
})

tap.test('should log path to created index in debug mode', t => {
  const fn = (opts, cb) => {
    createIndex(coerceComponent('plotly-graph'), opts, cb)
  }

  t.beforeEach((done) => {
    sinon.stub(console, 'log')
    done()
  })

  t.afterEach((done) => {
    console.log.restore()
    done()
  })

  t.test('(debug mode)', t => {
    fn({ debug: true }, (index) => {
      t.ok(console.log.calledOnce)
      t.match(console.log.args[0], /^created index/)
      t.end()
    })
  })

  t.test('(converse)', t => {
    fn({}, (index) => {
      t.ok(console.log.notCalled)
      t.end()
    })
  })

  t.end()
})

tap.test('should throw if writeFile fails', t => {
  const fn = () => {
    createIndex(coerceComponent('plotly-graph'))
  }

  t.beforeEach((done) => {
    sinon.stub(fs, 'writeFile').yields(true)
    done()
  })

  t.afterEach((done) => {
    fs.writeFile.restore()
    done()
  })

  t.test('does throw', t => {
    t.throws(fn, null)
    t.end()
  })

  t.end()
})
