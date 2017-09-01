const plotlyGraphCst = require('../src/component/plotly-graph/constants')
const minimist = require('minimist')

const PLOTLYJS_STRING = ['plotly', 'mapbox-access-token', 'topojson', 'mathjax']

const PLOTLYJS_ALIAS = {
  'plotly': ['plotlyjs', 'plotly-js', 'plotly_js', 'plotlyJS', 'plotlyJs'],
  'mapbox-access-token': ['mapboxAccessToken'],
  'mathjax': ['MathJax']
}

const PLOTLYJS_DEFAULT = {
  'plotly': '',
  'mapbox-access-token': process.env.MAPBOX_ACCESS_TOKEN || '',
  'topojson': '',
  'mathjax': ''
}

const DESCRIPTION = {
  help: 'Displays this message.',
  version: 'Displays package version.',
  debug: 'Starts app in debug mode and turn on verbose logs on stdout.',

  plotly: `Sets the path to the plotly.js bundle to use.
    This option can be also set to 'latest' or any valid plotly.js server release (e.g. 'v1.2.3'),
    where the corresponding plot.ly CDN bundle is used.
    By default, the 'latest' CDN bundle is used.`,

  mapboxAccessToken: `Sets mapbox access token. Required to export mapbox graphs.
    Alternatively, one can set a \`mapboxAccessToken\` environment variable.`,

  topojson: `Sets path to topojson files. By default topojson files on the plot.ly CDN are used.`,

  mathjax: `Sets path to MathJax files. Required to export LaTeX characters.`
}

const EXPORTER_MINIMIST_CONFIG = {
  'boolean': ['debug', 'help', 'version', 'verbose'],
  'string': [].concat(
    'output-dir',
    PLOTLYJS_STRING,
    ['format', 'scale', 'width', 'height'],
    'parallel-limit'
  ),

  'alias': Object.assign({
    'help': ['h'],
    'version': ['v'],
    'output-dir': ['d', 'outputDir'],
    'output': ['o']
  }, PLOTLYJS_ALIAS, {
    'format': ['f'],
    'parallel-limit': ['parallelLimit']
  }),

  'default': Object.assign({
    'debug': false,
    'help': false,
    'version': false,
    'verbose': false,
    'output-dir': process.cwd(),
    'output': ''
  }, PLOTLYJS_DEFAULT, {
    'format': '',
    'scale': '',
    'width': '',
    'height': '',
    'parallel-limit': ''
  })
}

const SERVER_MINIMIST_CONFIG = {
  'boolean': ['debug', 'help', 'version', 'quiet'],
  'string': [].concat(
    ['port', 'window-max-number'],
    PLOTLYJS_STRING
  ),

  'alias': Object.assign({
    'port': ['p'],
    'help': ['h'],
    'version': ['v'],
    'keep-alive': ['keepAlive'],
    'window-max-number': ['windowMaxNumber', 'maxNumberOfWindows']
  }, PLOTLYJS_ALIAS),

  'default': Object.assign({
    'port': process.env.PLOTLY_EXPORT_SERVER_PORT || 9091,
    'debug': false,
    'help': false,
    'version': false,
    'quiet': false,
    'keep-alive': false,
    'window-max-number': ''
  }, PLOTLYJS_DEFAULT)
}

exports.getExporterArgs = function () {
  return minimist(process.argv.slice(2), EXPORTER_MINIMIST_CONFIG)
}

exports.getServerArgs = function () {
  return minimist(process.argv.slice(2), SERVER_MINIMIST_CONFIG)
}

const makeFormatAliases = (config) => {
  return (opt) => {
    const aliases = config.alias[opt]
    const flags = aliases.map((a) => a.length === 1 ? `-${a}` : `--${a}`)
    return `[or ${flags.join(', ')}]`
  }
}

exports.getExporterHelpMsg = function () {
  const formatAliases = makeFormatAliases(EXPORTER_MINIMIST_CONFIG)

  return `plotly-graph-exporter

  Usage:

    $ plotly-graph-exporter [path/to/json/file(s), URL(s), glob(s), '{"data":[],"layout":{}}'] {options}

    $ cat plot.json | plotly-graph-exporter {options} > plot.png

  Options:

  --help ${formatAliases('help')}
    ${DESCRIPTION.help}

  --version ${formatAliases('version')}
    ${DESCRIPTION.version}

  --output-dir ${formatAliases('output-dir')}
    Sets output directory for the generated images. Defaults to the current working directory

  --output ${formatAliases('output')}
    Sets output filename. If multiple inputs are provided, then their item index will be appended to the filename.

  --plotly ${formatAliases('plotly')}
    ${DESCRIPTION.plotly}

  --mapbox-access-token ${formatAliases('mapbox-access-token')}
    ${DESCRIPTION.mapboxAccessToken}

  --topojson
    ${DESCRIPTION.topojson}

  --mathjax ${formatAliases('mathjax')}
    ${DESCRIPTION.mathjax}

  --format ${formatAliases('format')}
    Sets the output format (${Object.keys(plotlyGraphCst.contentFormat).join(', ')}). Applies to all output images.

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

  --debug
    ${DESCRIPTION.debug}
`
}

exports.getServerHelpMsg = function () {
  const formatAliases = makeFormatAliases(SERVER_MINIMIST_CONFIG)

  return `plotly-export-server

  Usage:

    $ plotly-export-server {options}

  Options:

  --port ${formatAliases('port')}
    Sets the server's port number.

  --help ${formatAliases('help')}
    Displays this message.

  --version ${formatAliases('version')}
    Displays package version.

  --quite
    Suppress all logging info.

  --keep-alive ${formatAliases('keep-alive')}
    Turn on keep-alive mode, where server app is restart on uncaught exceptions.

  --window-max-number ${formatAliases('window-max-number')}
    Set the maximum number of opened windows allowed.
    Request sent when max number of window is reached will return an error code.

  --plotly ${formatAliases('plotly')}
    ${DESCRIPTION.plotly}

  --mapbox-access-token ${formatAliases('mapbox-access-token')}
    ${DESCRIPTION.mapboxAccessToken}

  --topojson
    ${DESCRIPTION.topojson}

  --mathjax ${formatAliases('mathjax')}
    ${DESCRIPTION.mathjax}

  --debug
    ${DESCRIPTION.debug}
`
}
