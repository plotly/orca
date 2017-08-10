const tap = require('tap')
const path = require('path')
const coerceComponent = require('../../src/util/coerce-component')

tap.only('should fill defaults and reference to module', t => {
  const areEquivalent = [
    () => coerceComponent('plotly-graph'),
    () => coerceComponent({name: 'plotly-graph'}),
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

tap.only('should return null on non-string and non-object input', t => {
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

  t.test('', t => {
  
    t.end()
  })

  t.test('', t => {

    t.end()
  })

  t.end()
})

tap.test('should return null when path to component is not found', t => {

  t.end()
})

tap.test('should return null module in invalid', t => {

  // add mock/ folder

  t.end()
})

tap.test('should normalize *path*', t => {

  t.end()
})

tap.test('should set *inject* in noop if not set', t => {

  // add mock/ folder

  t.end()
})
