#!/usr/bin/env node

const path = require('path')
const { spawn } = require('child_process')
const electronPath = require('electron')

const args = process.argv.slice(2)
const pathToMain = path.join(__dirname, 'orca_electron.js')
args.unshift(path.resolve(pathToMain))

spawn(electronPath, args, { stdio: 'inherit' })
