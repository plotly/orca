const plotlyExporter = require('../')

// handle everything args environment variable related
//
// try https://github.com/indexzero/node-portfinder
//
// add bunyan here?

log(`Spinning up server with pid: ${process.pid}`)

const app = plotlyExporter.serve({
  port: 9091,
  debug: true
})

app.on('after-connect', (info) => {
  log(`Listening on port ${info.port}`)
})

app.on('after-convert', (info) => {
  log(`after-convert, pending: ${info.pending}`)
})

app.on('error', (info) => {
  log(`export error ${info.code} -  ${info.msg}`)
})

function log (msg) {
  console.log(msg)
}
