const orca = require('../src')
const plotlyGraphCst = require('../src/component/plotly-graph/constants')

const fs = require('fs')
const path = require('path')
const getStdin = require('get-stdin')
const str = require('string-to-stream')

const { PLOTLYJS_OPTS_META, extractOpts, formatOptsMeta } = require('./args')
const DEBUG_INFO = '\n  leaving window open for debugging'
const CHROME_VERSION = process.versions.chrome
const ELECTRON_VERSION = process.versions.electron

const OPTS_META = [].concat([{
  name: 'help',
  type: 'boolean',
  alias: ['h'],
  description: 'Displays this message.'
}, {
  name: 'output-dir',
  type: 'string',
  alias: ['d', 'outputDir'],
  dflt: process.cwd(),
  description: `Sets output directory for the generated images. Defaults to the current working directory.`
}, {
  name: 'output',
  type: 'string',
  alias: ['o'],
  description: `Sets output filename. If multiple inputs are provided, then their item index will be appended to the filename.`
}], PLOTLYJS_OPTS_META, [{
  name: 'format',
  type: 'string',
  alias: ['f'],
  dflt: 'png',
  description: `Sets the output format (${Object.keys(plotlyGraphCst.contentFormat).join(', ')}) Applies to all output images.`
}, {
  name: 'scale',
  type: 'string',
  dflt: '1',
  description: `Sets the image scale. Applies to all output images.`
}, {
  name: 'width',
  type: 'string',
  description: `Sets the image width. If not set, defaults to \`layout.width\` value. Applies to all output images.`
}, {
  name: 'height',
  type: 'string',
  description: `Sets the image height. If not set, defaults to \`layout.height\` value. Applies to all output images.`
}, {
  name: 'parallel-limit',
  type: 'string',
  alias: ['parallelLimit'],
  dflt: '1',
  description: 'Sets the limit of parallel tasks run.'
}, {
  name: 'verbose',
  type: 'boolean',
  description: 'Turn on verbose logging on stdout.'
}, {
  name: 'debug',
  type: 'boolean',
  description: 'Starts app in debug mode and turn on verbose logs on stdout.'
}])

const HELP_MSG = `orca graph

Usage:
    $ orca graph [path/to/json/file(s), URL(s), glob(s), '{"data":[],"layout":{}}'] {options}
    $ cat plot.json | orca graph {options} > plot.png

Options:
${formatOptsMeta(OPTS_META)}`

function makeGetItemName (input, opts) {
  const output = opts.output
  const hasMultipleInput = input.length > 1

  if (output) {
    const outputName = path.parse(output).name
    return hasMultipleInput
      ? (info) => `${outputName}_${info.itemIndex}`
      : () => outputName
  } else {
    return (info) => {
      const item = opts._[info.itemIndex]
      return fs.existsSync(item)
        ? path.parse(item).name
        : hasMultipleInput
          ? `fig_${info.itemIndex}`
          : 'fig'
    }
  }
}

function main (args) {
  const opts = extractOpts(args, OPTS_META)
  const DEBUG = opts.debug

  if (opts.help) {
    console.log(HELP_MSG)
    process.exit(0)
  }

  const fullOutputDir = opts.output
    ? path.join(opts.outputDir, path.dirname(opts.output))
    : opts.outputDir

  if (!fs.existsSync(fullOutputDir)) {
    fs.mkdirSync(fullOutputDir)
  }

  getStdin().then((txt) => {
    const hasStdin = !!txt
    const pipeToStdOut = hasStdin && !opts.output
    const showLogs = !pipeToStdOut && (DEBUG || opts.verbose)
    const input = hasStdin ? opts._.concat([txt]) : opts._
    const getItemName = makeGetItemName(input, opts)

    const write = (info, _, done) => {
      const itemName = getItemName(info)
      const outPath = path.resolve(fullOutputDir, `${itemName}.${info.format}`)

      if (pipeToStdOut) {
        str(info.body)
          .pipe(process.stdout.on('drain', done))
      } else {
        fs.writeFile(outPath, info.body, done)
      }
    }

    if (input.length === 0) {
      console.log('No input given. Run `orca graph --help for more info.')
      process.exit(0)
    }

    const app = orca.run({
      input: input,
      write: write,
      debug: DEBUG,
      parallelLimit: opts.parallelLimit,
      component: {
        name: 'plotly-graph',
        options: {
          plotlyJS: opts.plotly,
          mapboxAccessToken: opts['mapbox-access-token'],
          mathjax: opts.mathjax,
          topojson: opts.topojson,
          format: opts.format,
          scale: opts.scale,
          width: opts.width,
          height: opts.height,
          safeMode: opts.safeMode,
          inkscape: opts.inkscape
        }
      }
    })

    app.on('after-export', (info) => {
      const itemName = getItemName(info)

      if (showLogs) {
        console.log(`exported ${itemName}, in ${info.processingTime} ms`)
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

      if (DEBUG) {
        console.log(DEBUG_INFO)
      }

      const msg = `\ndone with code ${info.code} in ${timeStr} - ${info.msg}`

      if (info.code === 0) {
        if (showLogs) {
          console.log(msg)
        }
      } else {
        console.warn(msg)
        if (!DEBUG) {
          process.exit(1)
        }
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
}

module.exports = main
