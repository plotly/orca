const plotlyExporter = require('../')
const makeFormatAliases = require('../src/util/make-format-aliases')
const pkg = require('../package.json')
const subarg = require('subarg')

const ARGS_CONFIG = {
  'boolean': ['debug', 'help', 'version', 'quiet'],
  'string': ['port'],

  'alias': {
    'port': ['p'],
    'help': ['h'],
    'version': ['v']
  },

  'default': {
    'port': 9091,
    'debug': false,
    'help': false,
    'version': false,
    'quiet': false
  }
}

const argv = subarg(process.argv.slice(2), ARGS_CONFIG)
const formatAliases = makeFormatAliases(ARGS_CONFIG)
const showLogs = !argv.quiet

if (argv.version) {
  console.log(pkg.version)
  process.exit(0)
}

if (argv.help) {
  console.log(`plotly-export-server

  Usage:

    $ plotly-export-server {options}

  Options:

  --port ${formatAliases('port')}
    Sets the server's port number.

  --help ${formatAliases('help')}
    Displays this message.

  --version ${formatAliases('version')}
    Displays package version.

  --verbose
    Turn on verbose logging on stdout.

  --keep-alive (?)

  --debug
    Starts app in debug mode and turn on verbose logs on stdout.
  `)
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
    route: '',
    options: {
      plotlyJS: `${__dirname}/../../plotly.js/build/plotly.js`,
      mapboxAccessToken: 'pk.eyJ1IjoiZXRwaW5hcmQiLCJhIjoiY2luMHIzdHE0MGFxNXVubTRxczZ2YmUxaCJ9.hwWZful0U2CQxit4ItNsiQ',
      mathjax: `${__dirname}/../../plotly.js/dist/extras/mathjax/MathJax.js`,
      topojson: `${__dirname}/../../plotly.js/dist/plotly-geo-assets.js`
    }
  }, {
    name: 'plotly-dashboard',
    route: 'dashboard'
  }, {
    name: 'plotly-thumbnail',
    route: 'thumbnail',
    options: {
      // ...
      plotlyJS: `${__dirname}/../../plotly.js/build/plotly.js`,
      mapboxAccessToken: 'pk.eyJ1IjoiZXRwaW5hcmQiLCJhIjoiY2luMHIzdHE0MGFxNXVubTRxczZ2YmUxaCJ9.hwWZful0U2CQxit4ItNsiQ',
      topojson: `${__dirname}/../../plotly.js/dist/plotly-geo-assets.js`
    }
  }]
}

launch()

app.on('after-connect', (info) => {
  if (showLogs) {
    console.log(`Listening on port ${info.port} after a ${info.startupTime} ms bootup`)
    console.log(`Open routes: ${info.openRoutes.join(' ')}`)
  }
})

app.on('after-export', (info) => {
  if (showLogs) {
    console.log(`after-export, fig: ${info.fid} in ${info.processingTime} ms`)
  }
})

app.on('export-error', (info) => {
  if (showLogs) {
    console.log(`export error ${info.code} - ${info.msg}`)
  }
})

process.on('uncaughtException', (err) => {
  console.warn(err)
  console.log('... relaunching')
  launch()
})

function launch () {
  console.log(`Spinning up server with pid: ${process.pid}`)
  app = plotlyExporter.serve(opts)
}
