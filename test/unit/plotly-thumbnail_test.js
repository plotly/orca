const tap = require('tap')
const _module = require('../../src/component/plotly-thumbnail')

tap.test('parse:', t => {
  const fn = _module.parse

  t.test('should fill in defaults', t => {
    const body = {
      figure: {
        data: [{y: [1, 2, 1]}],
        layout: {
          margin: {l: 100, r: 100, t: 100, b: 100}
        }
      }
    }

    fn(body, {}, (errorCode, result) => {
      t.equal(errorCode, null, 'code')
      t.same(result, {
        figure: {
          data: [{y: [1, 2, 1]}],
          layout: {
            title: '',
            margin: {b: 0, l: 0, r: 0, t: 0}
          }
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

  t.end()
})
