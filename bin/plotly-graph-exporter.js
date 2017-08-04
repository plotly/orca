const plotlyExporter = require('../')
const cst = require('../src/component/plotly-graph/constants')
const makeFormatAliases = require('../src/util/make-format-aliases')
const pkg = require('../package.json')

const getStdin = require('get-stdin')
const subarg = require('subarg')
const fs = require('fs')
const path = require('path')

const ARGS_CONFIG = {
  'boolean': ['debug', 'help', 'version', 'verbose'],
  'string': [
    'plotly', 'mapbox-access-token', 'mathjax', 'topojson',
    'format', 'scale', 'width', 'height',
    'parallel-limit'
  ],

  'alias': {
    'help': ['h'],
    'version': ['v'],
    'plotly': ['plotlyjs', 'plotly-js', 'plotly_js', 'plotlyJS', 'plotlyJs'],
    'mapbox-access-token': ['mapboxAccessToken'],
    'mathjax': ['MathJax'],
    'format': ['f'],
    'parallel-limit': ['parallelLimit']
  },

  'default': {
    'debug': false,
    'help': false,
    'version': false,
    'verbose': false,
    'plotly': 'latest',
    'mapbox-access-token': process.env.mapboxAccessToken || '',
    'mathjax': '',
    'topojson': '',
    'format': '',
    'scale': '',
    'width': '',
    'height': '',
    'parallel-limit': ''
  }
}

const argv = subarg(process.argv.slice(2), ARGS_CONFIG)
const formatAliases = makeFormatAliases(ARGS_CONFIG)
const showLogs = argv.debug || argv.verbose

if (argv.version) {
  console.log(pkg.version)
  process.exit(0)
}

if (argv.help) {
  console.log(`plotly-graph-exporter

  Usage:

    $ plotly-graph-exporter [path/to/json/file(s), URL(s), glob(s), '{"data":[],"layout":{}}'] {options}

    $ cat plot.json | plotly-graph-exporter {options}

  Options:

  --help ${formatAliases('help')}
    Displays this message.

  --version ${formatAliases('version')}
    Displays package version.

  --plotly ${formatAliases('plotly')}
    Sets the path to the plotly.js bundle to use.
    This option can be also set to 'latest' or any valid plotly.js server release (e.g. 'v1.2.3'),
    where the corresponding plot.ly CDN bundle is used.
    By default, the 'latest' CDN bundle is used.

  --mapbox-access-token ${formatAliases('mapbox-access-token')}
    Sets mapbox access token. Required to export mapbox graphs.
    Alternatively, one can set a \`mapboxAccessToken\` environment variable.

  --topojson
    Sets path to topojson files. By default topojson files on the plot.ly CDN are used.

  --mathjax ${formatAliases('mathjax')}
    Sets path to MathJax files. Required to export LaTeX characters.

  --format ${formatAliases('format')}
    Sets the output format (${Object.keys(cst.contentFormat).join(', ')}). Applies to all output images.

  --scale
    Sets the image scale. Applies to all output images.

  --width
    Sets the image width. If not set, defaults to \`layout.width\` value. Applies to all output images.

  --height
    Sets the image height. If not set, defaults to \`layout.height\` value. Applies to all output images.

  --parallel-limit ${formatAliases('parallel-limit')}
    Sets the limit of parallel tasks run.

  --verbose
    Turn on verbose logging on stdout.

  --output (??)

  --output-dir (??)

  --overwrite (??)

  --debug
    Starts app in debug mode and turn on verbose logs on stdout.
  `)
  process.exit(0)
}

getStdin().then((txt) => {
  const hasStdin = !!txt

  const getItemName = hasStdin
    ? (info) => info.figure.layout.title.replace(/\s/g, '-') || 'stdin'
    : (info) => path.parse(argv._[info.itemIndex]).name

  const app = plotlyExporter.run({
    input: hasStdin ? argv._.concat([txt]) : argv._,
    debug: argv.debug,
    parallelLimit: argv.parallelLimit,
    component: {
      name: 'plotly-graph',
      options: {
        plotlyJS: path.resolve(argv.plotly),
        mapboxAccessToken: argv['mapbox-access-token'],
        mathjax: argv.mathjax,
        topojson: argv.topojson,
        format: argv.format,
        scale: argv.scale,
        width: argv.width,
        height: argv.height
      }
    }
  })

  app.on('after-export', (info) => {
    const itemName = getItemName(info)

    if (showLogs) {
      console.log(`exported ${itemName}, in ${info.processingTime} ms`)
    }

    fs.writeFile(`${itemName}.${info.format}`, info.body, (err) => {
      if (err) throw err
    })
  })

  app.on('export-error', (info) => {
    const itemName = getItemName(info)

    if (showLogs) {
      console.warn(`export error ${info.code} for ${itemName} - ${info.msg}`)
      console.warn(`  ${info.error}`)
    }
  })

  app.on('done', (info) => {
    const msg = `done with code ${info.code} in ${info.totalProcessingTime} ms - ${info.msg}`

    if (info.code === 200) {
      console.log('\n' + msg)
    } else if (argv.debug) {
      console.error('\n' + msg)
      console.lef('  leaving window open for debugging')
    } else {
      throw new Error(msg)
    }
  })

  app.on('renderer-error', (info) => {
    if (showLogs) {
      console.warn(`${info.msg} - ${info.error}`)
    }
  })

  process.on('uncaughtException', (err) => {
    console.warn(err)

    if (!argv.debug) {
      app.quit()
    }
  })
})
