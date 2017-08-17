const plotlyExporter = require('../')
const { getServerArgs, getServerHelpMsg } = require('./args')
const pkg = require('../package.json')

const argv = getServerArgs()
const SHOW_LOGS = !argv.quiet

if (argv.version) {
  console.log(pkg.version)
  process.exit(0)
}

if (argv.help) {
  console.log(getServerHelpMsg())
  process.exit(0)
}

// TODO
// - try https://github.com/indexzero/node-portfinder

let app

const opts = {
  port: argv.port,
  debug: argv.debug,
  component: [{
    name: 'plotly-graph',
    route: '/',
    options: {
      plotlyJS: argv.plotlyJS,
      mapboxAccessToken: argv['mapbox-access-token'],
      mathjax: argv.mathjax,
      topojson: argv.topojson
    }
  }, {
    name: 'plotly-dashboard',
    route: '/dashboard'
  }, {
    name: 'plotly-thumbnail',
    route: '/thumbnail',
    options: {
      plotlyJS: argv.plotlyJS,
      mapboxAccessToken: argv['mapbox-access-token'],
      mathjax: argv.mathjax,
      topojson: argv.topojson
    }
  }]
}

launch()

app.on('after-connect', (info) => {
  if (SHOW_LOGS) {
    console.log(`Listening on port ${info.port} after a ${info.startupTime} ms bootup`)
    console.log(`Open routes: ${info.openRoutes.join(' ')}`)
  }
})

app.on('after-export', (info) => {
  if (SHOW_LOGS) {
    console.log(`after-export, fig: ${info.fid} in ${info.processingTime} ms`)
  }
})

app.on('export-error', (info) => {
  if (SHOW_LOGS) {
    console.log(`export error ${info.code} - ${info.msg}`)
  }
})

process.on('uncaughtException', (err) => {
  console.warn(err)

  if (argv.keepAlive) {
    if (SHOW_LOGS) {
      console.log('... relaunching')
    }
    launch()
  }
})

function launch () {
  console.log(`Spinning up server with pid: ${process.pid}`)
  app = plotlyExporter.serve(opts)
}
