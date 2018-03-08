const { execSync } = require('child_process')
const { paths } = require('./common')

const mock = JSON.stringify({
  data: [{
    y: [1, 2, 1]
  }],
  layout: {
    title: 'test mock'
  }
})

execSync(`${paths.bin}/plotly-graph-exporter.js '${mock}' -f svg -d ${paths.build} -o test-mock`)
console.log(`${paths.build}/test-mock.svg created`)

execSync(`${paths.bin}/plotly-graph-exporter.js '${mock}' -f pdf -d ${paths.build} -o test-mock`)
console.log(`${paths.build}/test-mock.pdf created`)
