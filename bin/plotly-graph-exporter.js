const plotlyExporter = require('../')
const fs = require('fs')

// handle stdin inputs !!

const app = plotlyExporter.run({
  input: process.argv.slice(2),
  component: 'plotly-graph',
  debug: true
})

// file overwrite option?

app.on('after-convert', (info) => {
  console.log(`exported ${info.itemName}, in ${info.processingTime} nanoseconds`)

  fs.writeFile(`${info.itemName}.png`, info.body, (err) => {
    if (err) throw err
  })
})

app.on('export-error', (info) => {
  console.log(`export error ${info.code} - ${info.msg}`)
})

app.on('done', () => {
  console.log('done!!')
})
