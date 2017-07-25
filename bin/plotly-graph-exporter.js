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
  fs.writeFile(info.name + '.png', info.body, (err) => {
    if (err) throw err
  })
})

app.on('done', () => {
  console.log('done!!')
})
