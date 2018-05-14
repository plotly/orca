const minimist = require('minimist')
const pkg = require('../package.json')
const { sliceArgs } = require('./args')

const args = sliceArgs(process.argv)

const opts = minimist(args, {
  'boolean': ['help', 'version'],
  'alias': {
    'help': ['h'],
    'version': ['v']
  }
})

const BAD_CMD = 'Unrecognized orca command. Run `orca --help` for more info'

const HELP = `Plotly's image-exporting utilities

  Usage: orca [--version] [--help] <command> [<args>]

  Available commands:
  - graph [or plotly-graph, plotly_graph]
    Generates an image of plotly graph from inputted plotly.js JSON attributes.
    For more info, run \`orca graph --help\`.
  - serve [or server]
    Boots up a server with one route per available export component
    For more info, run \`orca serve --help\`.
`

if (opts._.length) {
  const cmd = opts._[0]
  const cmdArgs = args.slice(1)

  switch (cmd) {
    case 'graph':
    case 'plotly_graph':
    case 'plotly-graph':
      require('./graph')(cmdArgs)
      break

    case 'serve':
    case 'server':
      require('./serve')(cmdArgs)
      break

    default:
      console.log(BAD_CMD)
      process.exit(1)
  }
} else {
  if (opts.help) {
    console.log(HELP)
    process.exit(0)
  }
  if (opts.version) {
    console.log(pkg.version)
    process.exit(0)
  }

  console.log(HELP)
  process.exit(0)
}
