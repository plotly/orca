const plotlyExporter = require('../')
const subarg = require('subarg')
const fs = require('fs')

const argv = subarg(process.argv.slice(2))

// TODO
// - handle stdin inputs!
// - file overwrite option?
//
// - try to be on-par with https://github.com/rreusser/plotly-mock-viewer

const app = plotlyExporter.run({
  input: argv._,
  component: 'plotly-graph',
  debug: true
})

app.on('after-export', (info) => {
  console.log(`exported ${info.itemName}, in ${info.processingTime} ms`)

  fs.writeFile(`${info.itemName}.png`, info.body, (err) => {
    if (err) throw err
  })
})

app.on('export-error', (info) => {
  console.log(`export error ${info.code} for ${info.itemName} - ${info.msg}`)
})

// TODO more descriptive event name?
app.on('done', (info) => {
  console.log(`\ndone with code ${info.code} - ${info.msg}`)
})

app.on('renderer-error', (info) => {
  console.warn(`${info.msg} - ${info.error}`)
  app.quit()
})

process.on('uncaughtException', (err) => {
  console.warn(err)
  app.quit()
})
