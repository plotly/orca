const plotlyExporter = require('../')
const { getServerArgs, getServerHelpMsg } = require('./args')
const pkg = require('../package.json')

const argv = getServerArgs()
const SHOW_LOGS = !argv.quiet
const DEBUG = argv.debug

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

const plotlyJsOpts = {
  plotlyJS: argv.plotlyJS,
  mapboxAccessToken: argv['mapbox-access-token'],
  mathjax: argv.mathjax,
  topojson: argv.topojson
}

const opts = {
  port: argv.port,
  maxNumberOfWindows: argv.maxNumberOfWindows,
  debug: argv.debug,
  component: [
    {
      name: 'plotly-graph',
      route: '/',
      options: plotlyJsOpts
    }, {
      name: 'plotly-dashboard',
      route: '/dashboard'
    }, {
      name: 'plotly-thumbnail',
      route: '/thumbnail',
      options: plotlyJsOpts
    }, {
      name: 'plotly-dashboard-thumbnail',
      route: '/dashboard-thumbnail',
      options: plotlyJsOpts
    },
    {
      name: 'plotly-dashboard-preview',
      route: '/dashboard-preview',
      options: plotlyJsOpts
    }]
}

launch()

app.on('after-connect', (info) => {
  if (DEBUG) {
    console.log(`Listening on port ${info.port} after a ${info.startupTime} ms bootup`)
    console.log(`Open routes: ${info.openRoutes.join(' ')}`)
  }
})

var requestCount = 0

app.on('after-export', (info) => {
  if (SHOW_LOGS) {
    console.log(JSON.stringify({
      severity: 'INFO',
      httpRequest: {
        requestMethod: info.method
      },
      labels: {
        fid: info.fid,
        head: info.head,
        processingTime: info.processingTime
      }
    }))
  }

  if (requestCount++ >= 1000) {
    app.quit()
  }
})

app.on('export-error', (info) => {
  if (SHOW_LOGS) {
    console.log(JSON.stringify({
      severity: 'ERROR',
      textPayload: `${info.code} - ${info.msg}`,
      labels: {
        fid: info.fid,
        head: info.head
      }
    }))
  }
})

process.on('uncaughtException', (err) => {
  if (SHOW_LOGS) {
    console.log(JSON.stringify({
      severity: 'ERROR',
      textPayload: err.toString()
    }))
  }

  if (argv.keepAlive) {
    if (DEBUG) {
      console.log('... relaunching')
    }
    launch()
  }
})

function launch () {
  if (DEBUG) {
    console.log(`Spinning up server with pid: ${process.pid}`)
  }
  app = plotlyExporter.serve(opts)
}
