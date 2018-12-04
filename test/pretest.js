const { execSync } = require('child_process')
const { paths } = require('./common')
const fs = require('fs')

const mock = JSON.stringify({
  data: [{
    y: [1, 2, 1]
  }],
  layout: {
    title: 'test mock'
  }
})

fs.writeFileSync(`${paths.build}/test-mock.json`, mock)
// https://stackoverflow.com/a/31104898/392162 – "Use child_process.execSync but keep output in console"
const execSyncArgs = { stdio: [0, 1, 2] }

execSync(`${paths.bin} graph '${mock}' -f svg -d ${paths.build} -o test-mock`, execSyncArgs)
console.log(`${paths.build}/test-mock.svg created`)

execSync(`${paths.bin} graph '${mock}' -f pdf -d ${paths.build} -o test-mock`, execSyncArgs)
console.log(`${paths.build}/test-mock.pdf created`)
