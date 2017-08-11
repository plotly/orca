const plotlyExporter = require('../')
const args = require('./args')
const pkg = require('../package.json')

const getStdin = require('get-stdin')
const fs = require('fs')
const path = require('path')

const argv = args.getExporterArgs()
const DEBUG = argv.debug
const SHOW_LOGS = DEBUG || argv.verbose
const DEBUG_INFO = '\n  leaving window open for debugging'

if (argv.version) {
  console.log(pkg.version)
  process.exit(0)
}

if (argv.help) {
  console.log(args.getExporterHelpMsg())
  process.exit(0)
}

getStdin().then((txt) => {
  const hasStdin = !!txt

  const getItemName = hasStdin
    ? (info) => info.figure.layout.title.replace(/\s/g, '-') || 'stdin'
    : (info) => path.parse(argv._[info.itemIndex]).name

  const app = plotlyExporter.run({
    input: hasStdin ? argv._.concat([txt]) : argv._,
    debug: DEBUG,
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

    if (SHOW_LOGS) {
      console.log(`exported ${itemName}, in ${info.processingTime} ms`)
    }

    fs.writeFile(`${itemName}.${info.format}`, info.body, (err) => {
      if (err) throw err
    })
  })

  app.on('export-error', (info) => {
    const itemName = getItemName(info)

    if (SHOW_LOGS) {
      console.warn(`export error ${info.code} for ${itemName} - ${info.msg}`)
      console.warn(`  ${info.error}`)
    }
  })

  app.on('after-export-all', (info) => {
    const time = info.totalProcessingTime
    const timeStr = time > 6e4 ? `${(time / 6e4).toFixed(2)} min`
      : time > 1e3 ? `${(time / 1e3).toFixed(2)} sec`
      : `${time.toFixed(2)} ms`

    const msg = `done with code ${info.code} in ${timeStr} - ${info.msg}`

    if (info.code === 200) {
      if (SHOW_LOGS) {
        console.log('\n' + msg)
      }
      if (DEBUG) {
        console.log(DEBUG_INFO)
      }
    } else {
      if (DEBUG) {
        console.error('\n' + msg)
      } else {
        throw new Error(msg)
      }
    }
  })

  app.on('renderer-error', (info) => {
    if (SHOW_LOGS) {
      console.warn(`${info.msg} - ${info.error}`)
    }
  })

  if (DEBUG) {
    process.on('uncaughtException', (err) => {
      console.warn(err)
      console.log(DEBUG_INFO)
    })
  }
})
