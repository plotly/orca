const plotlyExporter = require('../')
const subarg = require('subarg')

const argv = subarg(process.argv.slice(2))

// TODO
// - by default, use `require.resolve` (or `pkg-up`) to find
//   closest plotly.js directory
// - try https://github.com/indexzero/node-portfinder

log(`Spinning up server with pid: ${process.pid}`)

const app = plotlyExporter.serve({
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
})

app.on('after-connect', (info) => {
  log(`Listening on port ${info.port} after a ${info.startupTime} ms bootup`)
  log(`Open routes: ${info.openRoutes}`)
})

app.on('after-export', (info) => {
  log(`after-export, fig: ${info.fid} in ${info.processingTime} ms`)
})

app.on('export-error', (info) => {
  log(`export error ${info.code} - ${info.msg}`)
})

function log (msg) {
  console.log(msg)
}
