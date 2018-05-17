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

if (process.platform === 'darwin' && process.argv.length === 1) {
  // On MacOS, create a script on /usr/local/bin,
  // so that orca can be invoked on the command line.
  const execSync = require('child_process').execSync
  const fs = require('fs')
  const path = require('path')
  const {app, dialog} = require('electron')

  const options = {
    type: 'info',
    buttons: ['Dismiss'],
    title: 'Orca Installer',
    message: 'Installation Succeeded!',
    detail:
      'To create your first image, open a terminal and run:\n\norca graph \'{ "data": [{"y": [1,2,1]}] }\' -o fig.png'
  }

  const source = path.join(__dirname, 'orca.sh')
  const target = '/usr/local/bin/orca'

  if (!fs.existsSync(target)) {
    try {
      execSync(`cp ${source} ${target}`)
    } catch (err) {
      options.type = 'error'
      options.message = 'Installation Failed!'
      options.detail = err.message
    }
  }

  app.on('ready', function () {
    dialog.showMessageBox(options)
    console.log(HELP)
    process.exit(options.type === 'error' ? 1 : 0)
  })
} else if (opts._.length) {
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
