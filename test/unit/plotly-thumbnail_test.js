const tap = require('tap')
const _module = require('../../src/component/plotly-thumbnail')

tap.test('parse:', t => {
  const fn = _module.parse

  t.test('should fill in defaults', t => {
    const body = {
      figure: {
        data: [{
          y: [1, 2, 1],
          xaxis: 'x2',
          yaxis: 'y3'
        }, {
          scene: 'scene20'
        }, {
          type: 'pie',
          marker: {}
        }],
        layout: {
          margin: { l: 100, r: 100, t: 100, b: 100 },
          yaxis: {
            title: 'some title',
            otherAttr: 'dummy'
          },
          yaxis2: {
            title: 'another title'
          },
          xaxis: {
            color: 'blue',
            title: 'yo'
          },
          xaxis14: {
            title: 'yooo'
          },
          scene: {
            xaxis: {
              title: '3D !!!',
              YO: 'yo'
            }
          },
          scene3: {
            zaxis: {
              dummy: 'DUMMY',
              showaxeslabels: true,
              showticklabels: true
            }
          }
        }
      }
    }

    fn(body, {}, {}, (errorCode, result) => {
      t.equal(errorCode, null, 'code')
      t.same(result, {
        figure: {
          data: [{
            y: [1, 2, 1],
            showscale: false,
            xaxis: 'x2',
            yaxis: 'y3'
          }, {
            scene: 'scene20',
            showscale: false
          }, {
            type: 'pie',
            showscale: false,
            marker: { showscale: false },
            textposition: 'none'
          }],
          layout: {
            title: '',
            showlegend: false,
            margin: { b: 0, l: 0, r: 0, t: 0 },
            yaxis: {
              title: '',
              otherAttr: 'dummy'
            },
            yaxis2: { title: '' },
            yaxis3: { title: '' },
            xaxis: {
              color: 'blue',
              title: ''
            },
            xaxis2: { title: '' },
            xaxis14: { title: '' },
            scene: {
              xaxis: {
                title: '',
                showaxeslabels: false,
                showticklabels: false,
                YO: 'yo'
              },
              yaxis: {
                title: '',
                showaxeslabels: false,
                showticklabels: false
              },
              zaxis: {
                title: '',
                showaxeslabels: false,
                showticklabels: false
              }
            },
            scene3: {
              xaxis: {
                title: '',
                showaxeslabels: false,
                showticklabels: false
              },
              yaxis: {
                title: '',
                showaxeslabels: false,
                showticklabels: false
              },
              zaxis: {
                dummy: 'DUMMY',
                title: '',
                showaxeslabels: false,
                showticklabels: false
              }
            },
            scene20: {
              xaxis: {
                title: '',
                showaxeslabels: false,
                showticklabels: false
              },
              yaxis: {
                title: '',
                showaxeslabels: false,
                showticklabels: false
              },
              zaxis: {
                title: '',
                showaxeslabels: false,
                showticklabels: false
              }
            }
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
