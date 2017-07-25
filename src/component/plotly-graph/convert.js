/**
 * @param {object} event
 * @param {info} info
 * @param {function} reply
 *  - head
 *  - body
 *
 */
function convert (event, info, reply) {
  let head
  let body

  switch (info.code) {
    case 200:
      head = {
        'Content-Type': 'image/png',
        'Content-Length': info.imgData.length
      }
      body = Buffer.from(info.imgData, 'base64')
      break
    case 525:
      head = {'Content-Type': 'text/plain'}
      body = 'plotly.js error'
      break
  }

  reply(head, body)
}

module.exports = convert
