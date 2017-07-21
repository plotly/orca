const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')

const fs = require('fs')
const path = require('path')
const https = require('https')
const url = require('url')
const events = require('events')

const DEBUG = !!process.env.DEBUG
const ARG  = process.argv[2] || '0'
const URL = url.parse(ARG).host
  ? ARG
  : `https://raw.githubusercontent.com/plotly/plotly.js/master/test/image/mocks/${ARG}.json`

let win = null
let pending = 0

const ASYNC_LIMT = 10

const components = {
  'plotly-graph': require('./components/plotly-graph/')
}

app.commandLine.appendSwitch('ignore-gpu-blacklist')

app.on('ready', () => {
  win = new BrowserWindow({
    height: 1024,
    width: 1024
  })

  // TODO create this on-demand in temporary file
  // with specified plotly.js version
  // with or without MathJax
  win.loadURL(`file://${__dirname}/index.html`)

  if (DEBUG) {
    win.openDevTools()
  }

  win.on('closed', () => {
    win = null
  })

  win.webContents.on('did-finish-load', () => {
    // https://github.com/feross/run-parallel-limit

    // maybe loader step to components?
    
    // how should api know which component to use?

    wget(URL, (err, body) => {
      if (err) {
        console.warn('log this thing!')
      }

      const info = {
        name: 'plotly-graph',
        fig: JSON.parse(body),
        format: 'png'
      }

      pending++
      win.webContents.send('plotly-graph', info)
    })
  })
})

ipcMain.on('asynchronous-message', (event, info) => {
  const done = (result) => {
    // emit 'after-convert' event here?
    // so that pixel comparison routine can hook into it? 
    
    if (!--pending) {
      win.close()

      // should emit here 
    }
  }

  // emit 'after-render' event here?

  // handle 'pong' here

  console.log(info.component)
  components[info.component].convert(event, info, done)
})

function wget (URL, cb) {
  let body = ''

  https.get(URL, (res) => {
    res.on('data', (chunk) => body += chunk)
    res.on('end', () => cb(null, body))
  })
  .on('error', (err) => cb(err))
}
