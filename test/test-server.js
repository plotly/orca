const https = require('https')
const url = require('url')
const fs = require('fs')
const request = require('request')
const uuid = require('uuid/v4')

const SERVER_URL = 'http://localhost:9091'
const MOCK_URL_BASE = 'https://raw.githubusercontent.com/plotly/plotly.js/master/test/image/mocks'
const FORMAT = 'png'

const argv = process.argv.slice(2)
const list = argv.length > 0 ? argv : ['0']

// pong
request({
  method: 'post',
  url: SERVER_URL + '/ping'
})
.on('error', (err) => console.warn(err))
.pipe(process.stdout)

// mock list
list.forEach(p => {
  const figUrl = url.parse(p).host
    ? p
    : `${MOCK_URL_BASE}/${p}.json`

  wget(figUrl, (err, _fig) => {
    if (err) throw err

    const fig = JSON.parse(_fig)

    // add LaTeX !
    fig.layout.title = '$\\int_x^\\infty f(x) dx$'

    request({
      method: 'post',
      url: SERVER_URL + '/',
      body: JSON.stringify({
        fid: uuid(),
        figure: fig,
        format: FORMAT
      })
    })
    .on('error', (err) => console.warn(err))
    .on('response', (res) => console.warn(res.statusCode))
    .pipe(fs.createWriteStream(`${p}.${FORMAT}`))
  })
})

// try dashboard
request({
  method: 'post',
  url: SERVER_URL + '/dashboard',
  body: JSON.stringify({
    fid: uuid(),
    url: 'https://plot.ly/dashboard/jackp:17872/present',
    format: 'pdf'
  })
})
.on('error', (err) => console.warn(err))
.on('response', (res) => console.warn(res.statusCode))
.pipe(fs.createWriteStream('dashboard.pdf'))

function wget (url, cb) {
  let body = ''

  https.get(url, res => {
    res.on('data', chunk => { body += chunk })
    res.on('end', () => cb(null, body))
  })
  .on('error', err => cb(err))
}
