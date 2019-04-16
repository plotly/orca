const tap = require('tap')
const _module = require('../../src/component/plotly-dashboard-thumbnail')

tap.test('parse:', t => {
  const fn = _module.parse

  t.test('should fill in defaults', t => {
    const body = {
      settings: { backgroundColor: '#d3d3d3' },
      figure: {
        layout: {
          type: 'split',
          first: {
            type: 'split',
            first: {
              type: 'box',
              boxType: 'plot',
              figure: {
                data: [{
                  y: [1, 2, 1]
                }]
              }
            },
            second: {
              type: 'box',
              boxType: 'plot',
              figure: {
                data: [{
                  type: 'bar',
                  y: [1, 2, 4]
                }]
              }
            }
          },
          second: {
            type: 'split',
            first: {
              type: 'box',
              boxType: 'plot',
              figure: {
                data: [{
                  type: 'heatmap',
                  z: [[1, 2, 4], [1, 2, 3]]
                }]
              }
            },
            second: {
              type: 'box',
              boxType: 'plot',
              figure: {
                data: [{
                  type: 'scatter3d',
                  x: [1, 2, 3],
                  y: [1, 2, 3],
                  z: [1, 2, 1]
                }]
              }
            }
          }
        }
      }
    }

    fn(body, {}, {}, (errorCode, result) => {
      t.equal(errorCode, null, 'code')

      t.equal(result.backgroundColor, '#d3d3d3', 'backgroundColor')
      t.equal(result.panels.length, 4, '# of panels')

      result.panels.forEach(p => {
        t.type(p.data, Array, 'has data array')
        t.type(p.layout, Object, 'has layout object')
      })

      t.end()
    })
  })

  t.end()
})
