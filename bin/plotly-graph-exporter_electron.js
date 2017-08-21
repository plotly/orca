const plotlyExporter = require('../')
const { getExporterArgs, getExporterHelpMsg } = require('./args')
const pkg = require('../package.json')

const fs = require('fs')
const path = require('path')
const getStdin = require('get-stdin')
const str = require('string-to-stream')

const argv = getExporterArgs()
const DEBUG = argv.debug
const DEBUG_INFO = '\n  leaving window open for debugging'
const CHROME_VERSION = process.versions.chrome
const ELECTRON_VERSION = process.versions.electron

if (argv.version) {
  console.log(pkg.version)
  process.exit(0)
}

if (argv.help) {
  console.log(getExporterHelpMsg())
  process.exit(0)
}

if (!fs.existsSync(argv.outputDir)) {
  fs.mkdirSync(argv.outputDir)
}

getStdin().then((txt) => {
  const hasStdin = !!txt
  const pipeToStdOut = hasStdin && !argv.output && !argv.outputDir
  const showLogs = !pipeToStdOut && (DEBUG || argv.verbose)
  const input = hasStdin ? argv._.concat([txt]) : argv._
  const getItemName = makeGetItemName(input)

  const app = plotlyExporter.run({
    input: input,
    debug: DEBUG,
    parallelLimit: argv.parallelLimit,
    component: {
      name: 'plotly-graph',
      options: {
        plotlyJS: argv.plotly,
        mapboxAccessToken: argv['mapbox-access-token'],
        mathjax: argv.mathjax,
        topojson: argv.topojson,
        batik: argv.batik || path.join(__dirname, '..', 'build', 'batik-1.7', 'batik-rasterizer.jar'),
        format: argv.format,
        scale: argv.scale,
        width: argv.width,
        height: argv.height
      }
    }
  })

  app.on('after-export', (info) => {
    const itemName = getItemName(info)
    const outPath = path.resolve(argv.outputDir, `${itemName}.${info.format}`)

    if (showLogs) {
      console.log(`exported ${itemName}, in ${info.processingTime} ms`)
    }

    if (pipeToStdOut) {
      str(info.body).pipe(process.stdout)
    } else {
      fs.writeFile(outPath, info.body, (err) => {
        if (err) console.warn(err)
      })
    }
  })

  app.on('export-error', (info) => {
    const itemName = getItemName(info)

    if (showLogs) {
      console.warn(`export error ${info.code} for ${itemName} - ${info.msg}`)
      console.warn(`  ${info.error}`)
    }
  })

  app.on('after-export-all', (info) => {
    const time = info.totalProcessingTime
    const timeStr = time > 6e4 ? `${(time / 6e4).toFixed(2)} min`
      : time > 1e3 ? `${(time / 1e3).toFixed(2)} sec`
      : `${time.toFixed(2)} ms`

    if (DEBUG) console.log(DEBUG_INFO)

    const msg = `\ndone with code ${info.code} in ${timeStr} - ${info.msg}`

    if (info.code === 200) {
      if (showLogs) {
        console.log(msg)
      }
    } else {
      console.warn(msg)
      if (!DEBUG) process.exit(1)
    }
  })

  app.on('renderer-error', (info) => {
    if (showLogs) {
      console.warn(`${info.msg} - ${info.error}
        Chrome version ${CHROME_VERSION}
        Electron version ${ELECTRON_VERSION}`)
    }
  })

  if (DEBUG) {
    process.on('uncaughtException', (err) => {
      console.warn(err)
      console.warn(DEBUG_INFO)
    })
  }
})

function makeGetItemName (input) {
  const output = argv.output
  const hasMultipleInput = input.length > 1

  if (output) {
    const outputName = path.parse(output).name
    return hasMultipleInput
      ? (info) => `${outputName}_${info.itemIndex}`
      : () => outputName
  } else {
    return (info) => {
      const item = argv._[info.itemIndex]
      return fs.existsSync(item)
        ? path.parse(item).name
        : hasMultipleInput
          ? `fig_${info.itemIndex}`
          : 'fig'
    }
  }
}
