const minimist = require('minimist')

exports.PLOTLYJS_OPTS_META = [{
  name: 'plotly',
  type: 'string',
  alias: ['plotlyjs', 'plotly-js', 'plotly_js', 'plotlyJS', 'plotlyJs'],
  dflt: '',
  description: `Sets the path to the plotly.js bundle to use.
    This option can be also set to 'latest' or any valid plotly.js server release (e.g. 'v1.2.3'),
    where the corresponding plot.ly CDN bundle is used.
    By default, the 'latest' CDN bundle is used.`
}, {
  name: 'mapbox-access-token',
  type: 'string',
  alias: ['mapboxAccessToken'],
  dflt: process.env.MAPBOX_ACCESS_TOKEN || '',
  description: `Sets mapbox access token. Required to export mapbox graphs.
    Alternatively, one can set a \`MAPBOX_ACCESS_TOKEN\` environment variable.`
}, {
  name: 'topojson',
  type: 'string',
  dflt: '',
  description: `Sets path to topojson files.
    By default, topojson files on the plot.ly CDN are used.`
}, {
  name: 'mathjax',
  type: 'string',
  alias: ['MathJax'],
  dflt: '',
  description: `Sets path to MathJax files. Required to export LaTeX characters.`
}, {
  name: 'inkscape',
  type: 'string',
  alias: ['Inkscape'],
  dflt: '',
  description: `Sets path to Inkscape executable. Required to export WMF and EMF formats.`
}, {
  name: 'safe-mode',
  type: 'boolean',
  alias: ['safeMode', 'safe'],
  description: 'Turns on safe mode: where figures likely to make browser window hang during image generating are skipped.'
}]

exports.sliceArgs = function (args) {
  // https://electronjs.org/docs/api/process#processdefaultapp
  // https://github.com/electron/electron/issues/4690#issuecomment-217435222
  // https://github.com/tj/commander.js/issues/512
  const sliceBegin = process.defaultApp ? 2 : 1
  return args.slice(sliceBegin)
}

exports.extractOpts = function (args, meta) {
  const minimistOpts = {
    'boolean': meta.filter(o => o.type === 'boolean').map(o => o.name),
    'string': meta.filter(o => o.type === 'string').map(o => o.name)
  }

  minimistOpts.alias = {}
  meta.filter(o => o.alias).forEach(o => { minimistOpts.alias[o.name] = o.alias })

  minimistOpts['default'] = {}
  meta.filter(o => o.dflt).forEach(o => { minimistOpts['default'][o.name] = o.dflt })

  return minimist(args, minimistOpts)
}

exports.formatOptsMeta = function (meta) {
  const formatAlias = (o) => {
    if (!o.alias) return ''

    const list = o.alias
      .map(a => a.length === 1 ? `-${a}` : `--${a}`)
      .join(', ')

    return `[or ${list}]`
  }

  return meta
    .map(o => `  --${o.name} ${formatAlias(o)}\n    ${o.description}`)
    .join('\n')
}
