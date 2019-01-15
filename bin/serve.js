const orca = require('../src')
const { PLOTLYJS_OPTS_META, extractOpts, formatOptsMeta } = require('./args')

const OPTS_META = [].concat([{
  name: 'help',
  type: 'boolean',
  alias: ['h'],
  description: 'Displays this message.'
}, {
  name: 'port',
  type: 'string',
  alias: ['p'],
  dflt: process.env.ORCA_PORT || 9091,
  description: 'Sets the server\'s port number.'
}], PLOTLYJS_OPTS_META, [{
  name: 'request-limit',
  type: 'string',
  alias: ['requestLimit'],
  description: 'Sets a request limit that makes orca exit when reached.'
}, {
  name: 'keep-alive',
  type: 'boolean',
  alias: ['keepAlive'],
  description: 'Turn on keep alive mode where orca will (try to) relaunch server if process unexpectedly exits.'
}, {
  name: 'window-max-number',
  type: 'string',
  alias: ['windowMaxNumber', 'maxNumberOfWindows'],
  description: 'Sets maximum number of browser windows the server can keep open at a given time.'
}, {
  name: 'graph-only',
  type: 'boolean',
  alias: ['graphOnly'],
  description: 'Launches only the graph component (not thumbnails, dash, etc.) to save memory and reduce the number of processes.'
}, {
  name: 'quiet',
  type: 'boolean',
  description: 'Suppress all logging info.'
}, {
  name: 'debug',
  type: 'boolean',
  description: 'Starts app in debug mode.'
}, {
  name: 'cors',
  type: 'boolean',
  description: 'Enables Cross-Origin Resource Sharing (CORS)'
}])

const HELP_MSG = `orca serve

Usage:
  $ orca serve -p 9999

Options:
${formatOptsMeta(OPTS_META)}`

function main (args) {
  let app
  let requestCount = 0

  const opts = extractOpts(args, OPTS_META)
  const SHOW_LOGS = !opts.quiet
  const DEBUG = opts.debug
  const requestLimit = opts.requestLimit ? Number(opts.requestLimit) : Infinity

  if (opts.help) {
    console.log(HELP_MSG)
    process.exit(0)
  }

  const plotlyJsOpts = {
    plotlyJS: opts.plotlyJS,
    mapboxAccessToken: opts['mapbox-access-token'],
    mathjax: opts.mathjax,
    topojson: opts.topojson,
    safeMode: opts.safeMode,
    inkscape: opts.inkscape
  }

  function launch () {
    if (DEBUG) {
      console.log(`Spinning up server with pid: ${process.pid}`)
    }

    let component = [{
      name: 'plotly-graph',
      route: '/',
      options: plotlyJsOpts
    }]

    if (!opts.graphOnly) {
      component.push({
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
      }, {
        name: 'plotly-dashboard-preview',
        route: '/dashboard-preview',
        options: plotlyJsOpts
      }, {
        name: 'plotly-dash-preview',
        route: '/dash-preview',
        options: plotlyJsOpts
      })
    }

    app = orca.serve({
      port: opts.port,
      maxNumberOfWindows: opts.maxNumberOfWindows,
      debug: opts.debug,
      component: component,
      cors: opts.cors
    })

    app.on('after-connect', (info) => {
      if (DEBUG) {
        console.log(`Listening on port ${info.port} after a ${info.startupTime} ms bootup`)
        console.log(`Open routes: ${info.openRoutes.join(' ')}`)
      }
    })

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

      if (requestCount++ >= requestLimit) {
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

    app.on('renderer-error', (info) => {
      if (SHOW_LOGS) {
        console.log(JSON.stringify({
          severity: 'ERROR',
          textPayload: `${info.msg} - ${info.error}`
        }))
      }
    })
  }

  process.on('uncaughtException', (err) => {
    if (SHOW_LOGS) {
      console.log(JSON.stringify({
        severity: 'ERROR',
        textPayload: err.toString()
      }))
    }

    if (opts.keepAlive) {
      if (DEBUG) {
        console.log('... relaunching')
      }
      launch()
    }
  })

  launch()
}

module.exports = main
