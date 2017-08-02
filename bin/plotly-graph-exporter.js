const plotlyExporter = require('../')
const pkg = require('../package.json')
const getStdin = require('get-stdin')
const subarg = require('subarg')
const fs = require('fs')
const path = require('path')

const ARGS_CONFIG = {
  'boolean': ['debug', 'help', 'version'],
  'string': ['plotly', 'mapbox-access-token', 'mathjax', 'topojson'],

  'alias': {
    'help': ['h'],
    'version': ['v'],
    'plotly': ['plotlyjs', 'plotly-js', 'plotly_js', 'plotlyJS', 'plotlyJs'],
    'mapbox-access-token': ['mapboxAccessToken'],
    'mathjax': ['MathJax']
  },

  'default': {
    'debug': false,
    'help': false,
    'version': false,
    'plotly': 'latest',
    'mapbox-access-token': process.env.mapboxAccessToken || '',
    'mathjax': '',
    'topojson': ''
  }
}

const argv = subarg(process.argv.slice(2), ARGS_CONFIG)

if (argv.version) {
  console.log(pkg.version)
  process.exit(0)
}

const showAliases = (opt) => {
  const aliases = ARGS_CONFIG.alias[opt]
  const flags = aliases.map((a) => a.length === 1 ? `-${a}` : `--${a}`)
  return `[or ${flags.join(', ')}]`
}

if (argv.help) {
  console.log(`plotly-graph-exporter

  Usage:

    $ plotly-graph-exporter [path/to/json/file(s) URL(s), glob(s), '{"data":[],"layout":{}}'] {options}

    $ cat plot.json | plotly-graph-exporter {options}

  Options:

  --help ${showAliases('help')}
    Displays this message.

  --version ${showAliases('version')}
    Displays package version.

  --plotly ${showAliases('plotly.js')}
    Sets the path to the plotly.js to use.
    This option can be also set to 'latest' or any valid plotly.js server release (e.g. '1.2.3'),
    where the corresponding plot.ly CDN bundle is used.
    By default, the 'latest' CDN bundle is used.

  --mapbox-access-token ${showAliases('mapbox-access-token')}
    Sets mapbox access token. Required to export mapbox graphs.
    Alternatively, one can set a \`mapboxAccessToken\` environment variable.

  --topojson
    Sets path to topojson files. By default topojson files on the plot.ly CDN are used.

  --mathjax ${showAliases('mathjax')}
    Sets path to MathJax files. Required to export LaTeX characters.

  --format

  --scale

  --width

  --height

  --output (??)

  --overwrite (??)

  --debug
    Starts app in debug mode.
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
    component: {
      name: 'plotly-graph',
      options: {
        plotlyJS: argv.plotly,
        mapboxAccessToken: argv['mapbox-access-token'],
        mathjax: argv.mathjax,
        topojson: argv.topojson
      }
    }
  })

  app.on('after-export', (info) => {
    const itemName = getItemName(info)
    console.log(`exported ${itemName}, in ${info.processingTime} ms`)

    fs.writeFile(`${itemName}.${info.format}`, info.body, (err) => {
      if (err) throw err
    })
  })

  app.on('export-error', (info) => {
    const itemName = getItemName(info)
    console.log(`export error ${info.code} for ${itemName} - ${info.msg}`)
  })

  // TODO more descriptive event name?
  app.on('done', (info) => {
    console.log(`\ndone with code ${info.code} - ${info.msg}`)
  })

  app.on('renderer-error', (info) => {
    console.warn(`${info.msg} - ${info.error}`)
    app.quit()
  })

  process.on('uncaughtException', (err) => {
    console.warn(err)
    app.quit()
  })
})
