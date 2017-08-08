const plotlyExporter = require('../')
const args = require('./args')
const pkg = require('../package.json')

const getStdin = require('get-stdin')
const fs = require('fs')
const path = require('path')

const argv = args.getExporterArgs()
const showLogs = argv.debug || argv.verbose

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
    debug: argv.debug,
    parallelLimit: argv.parallelLimit,
    component: {
      name: 'plotly-graph',
      plotlyJS: path.resolve(argv.plotly),
      mapboxAccessToken: argv['mapbox-access-token'],
      mathjax: argv.mathjax,
      topojson: argv.topojson,
      format: argv.format,
      scale: argv.scale,
      width: argv.width,
      height: argv.height
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

  app.on('after-export-all', (info) => {
    const msg = `done with code ${info.code} in ${info.totalProcessingTime} ms - ${info.msg}`

    if (info.code === 200) {
      console.log('\n' + msg)
    } else if (argv.debug) {
      console.error('\n' + msg)
      console.log('  leaving window open for debugging')
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
