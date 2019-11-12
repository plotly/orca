#!/usr/bin/env node

const path = require('path')
const { spawn } = require('child_process')
const electronPath = process.env['ELECTRON_PATH'] ? process.env['ELECTRON_PATH'] : require('electron')

const args = process.argv.slice(2)
const pathToMain = path.join(__dirname, 'orca_electron.js')
args.unshift(path.resolve(pathToMain))

// Sandbox is enabled by default since electron v5
// Fix sandbox issue (https://github.com/electron/electron/issues/17972)
args.push('--no-sandbox')

spawn(electronPath, args, { stdio: 'inherit' })
