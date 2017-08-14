const path = require('path')
const { spawn } = require('child_process')
const electronPath = require('electron')

function spawnElectron (appName) {
  const args = process.argv.slice(2)
  const pathToMain = path.join(__dirname, appName)
  args.unshift(path.resolve(pathToMain))

  spawn(electronPath, args, {stdio: 'inherit'})
}

module.exports = spawnElectron
