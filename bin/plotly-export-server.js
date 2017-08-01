const plotlyExporter = require('../')
const subarg = require('subarg')

const argv = subarg(process.argv.slice(2))

// TODO
// - by default, use `require.resolve` (or `pkg-up`) to find
//   closest plotly.js directory
// - try https://github.com/indexzero/node-portfinder

let app

const opts = {
  port: argv.port || 9091,
  debug: true,
  component: [{
    name: 'plotly-graph',
    route: '',
    options: {
      MathJax: `${__dirname}/../../plotly.js/dist/extras/mathjax/MathJax.js`,
      pathToPlotlyJS: `${__dirname}/../../plotly.js/build/plotly.js`,
      localTopojson: `${__dirname}/../../plotly.js/dist/plotly-geo-assets.js`,
      mapboxAccessToken: 'pk.eyJ1IjoiZXRwaW5hcmQiLCJhIjoiY2luMHIzdHE0MGFxNXVubTRxczZ2YmUxaCJ9.hwWZful0U2CQxit4ItNsiQ'
    }
  }]
}

launch()

app.on('after-connect', (info) => {
  console.log(`Listening on port ${info.port} after a ${info.startupTime} ms bootup`)
  console.log(`Open routes: ${info.openRoutes.join(' ')}`)
})

app.on('after-export', (info) => {
  console.log(`after-export, fig: ${info.fid} in ${info.processingTime} ms`)
})

app.on('export-error', (info) => {
  console.log(`export error ${info.code} - ${info.msg}`)
})

process.on('uncaughtException', (err) => {
  console.warn(err)
  launch()
})

function launch () {
  console.log(`Spinning up server with pid: ${process.pid}`)
  app = plotlyExporter.serve(opts)
}
