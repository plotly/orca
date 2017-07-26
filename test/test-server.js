const https = require('https')
const url = require('url')
const fs = require('fs')
const request = require('request')

const SERVER_URL = 'http://localhost:9091'
const MOCK_URL_BASE = 'https://raw.githubusercontent.com/plotly/plotly.js/master/test/image/mocks'

const argv = process.argv.slice(2)
const list = argv.length > 0 ? argv : ['0']

request({
  method: 'post',
  url: SERVER_URL + '/ping'
})
.on('error', (err) => console.warn(err))
.pipe(process.stdout)

list.forEach(p => {
  const figUrl = url.parse(p).host
    ? p
    : `${MOCK_URL_BASE}/${p}.json`

  wget(figUrl, (err, fig) => {
    if (err) throw err

    request({
      method: 'post',
      url: SERVER_URL + '/plotly-graph',
      body: JSON.stringify({
        figure: JSON.parse(fig),
        format: 'jpeg'
      })
    })
    .on('error', (err) => console.warn(err))
    .pipe(fs.createWriteStream(`${p}.png`))
  })
})

function wget (url, cb) {
  let body = ''

  https.get(url, res => {
    res.on('data', chunk => { body += chunk })
    res.on('end', () => cb(null, body))
  })
  .on('error', err => cb(err))
}
