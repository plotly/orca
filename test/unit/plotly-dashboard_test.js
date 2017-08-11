const tap = require('tap')
const _module = require('../../src/component/plotly-dashboard')

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

  t.end()
})
