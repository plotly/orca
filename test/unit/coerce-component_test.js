const tap = require('tap')
const path = require('path')
const fs = require('fs')
const uuid = require('uuid/v4')

const coerceComponent = require('../../src/util/coerce-component')
const PATH_TO_BUILD = path.join(__dirname, '..', '..', 'build')

const testMockComponentModule = (t, compModuleContent, cb) => {
  const compPath = path.join(PATH_TO_BUILD, uuid() + '.js')
  const comp = {path: compPath}

  fs.writeFile(compPath, compModuleContent, (err) => {
    if (err) fs.unlink(compPath, t.fail)

    cb(comp)
    fs.unlink(compPath, t.end)
  })
}

tap.test('should fill defaults and reference to module', t => {
  const areEquivalent = [
    () => coerceComponent('plotly-graph'),
    () => coerceComponent({name: 'plotly-graph'}),
    () => coerceComponent({name: 'plotly-graph', options: {plotlyJS: 'v1.20.0'}}),
    () => coerceComponent({path: path.join(__dirname, '..', '..', 'src', 'component', 'plotly-graph')})
  ]

  areEquivalent.forEach((fn, i) => {
    t.test(`(with input style ${i})`, t => {
      const comp = fn()

      t.same(Object.keys(comp).length, 5, '# of keys')
      t.equal(comp.name, 'plotly-graph', 'name')
      t.equal(path.basename(comp.path), 'plotly-graph', 'path')
      t.equal(comp.route, '/plotly-graph', 'route')
      t.type(comp._module, 'object', '_module ref')
      t.type(comp.options, 'object', 'options ref')
      t.end()
    })
  })

  t.end()
})

tap.test('should return null on non-string and non-object input', t => {
  const shouldFail = ['', false, null, []]

  shouldFail.forEach(d => {
    t.test(`(input ${JSON.stringify(d)})`, t => {
      t.equal(coerceComponent(d), null)
      t.end()
    })
  })

  t.end()
})

tap.test('should return null when path to component is not found', t => {
  t.test('when component has no *path* or *name* key', t => {
    const shouldFail = [{}, {nopath: 'p', noname: 'n'}]

    shouldFail.forEach(d => {
      t.test(`(input ${JSON.stringify(d)})`, t => {
        t.equal(coerceComponent(d), null)
        t.end()
      })
    })

    t.end()
  })

  t.test('when *path* does not resolve', t => {
    t.equal(coerceComponent({path: 'not/gonna/work'}), null)
    t.end()
  })

  t.end()
})

tap.test('should return null if module is invalid', t => {
  const content = {}

  content['missing name'] = `module.exports = {
    parse: () => {},
    render: () => {},
    convert: () => {}
  }`
  content['missing parse'] = `module.exports = {
    name: 'n',
    render: () => {},
    convert: () => {}
  }`
  content['missing render'] = `module.export = {
    name: 'n',
    parse: () => {},
    convert: () => {}
  }`
  content['missing convert'] = `module.exports = {
    name: 'n',
    parse: () => {},
    render: () => {}
  }`

  Object.keys(content).forEach(k => {
    t.test(`(${k})`, t => {
      testMockComponentModule(t, content[k], (comp) => {
        t.equal(coerceComponent(comp), null)
      })
    })
  })

  t.end()
})

tap.test('should normalize *route*', t => {
  const areEquivalent = [
    () => coerceComponent({name: 'plotly-graph'}),
    () => coerceComponent({name: 'plotly-graph', route: '/plotly-graph'}),
    () => coerceComponent({name: 'plotly-graph', route: 'plotly-graph'})
  ]

  areEquivalent.forEach((fn, i) => {
    t.test(`(with input style ${i})`, t => {
      const comp = fn()
      t.equal(comp.route, '/plotly-graph')
      t.end()
    })
  })

  t.end()
})

tap.test('should set *inject* in noop if not set', t => {
  const content = `module.exports = {
    name: 'n',
    parse: () => {},
    render: () => {},
    convert: () => {}
  }`

  testMockComponentModule(t, content, (_comp) => {
    const comp = coerceComponent(_comp)

    t.type(comp._module.inject, 'function')
  })
})
