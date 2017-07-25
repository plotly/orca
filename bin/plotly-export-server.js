const plotlyExporter = require('../')

// handle everything args environment variable related

const app = plotlyExporter.serve({
  port: 9091,
  debug: true
})

app.on('after-convert', (pending) => {
  console.log('after-convert, pending:', pending)
})
