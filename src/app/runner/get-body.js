const fs = require('fs')
const isUrl = require('is-url')
const request = require('request')

/**
 * @param {string} item :
 * @param {function} cb :
 *  - err
 *  - body
 */
function getBody (item, cb) {
  if (fs.existsSync(item)) {
    fs.readFile(item, 'utf-8', cb)
  } else if (fs.existsSync(item + '.json')) {
    fs.readFile(item + '.json', 'utf-8', cb)
  } else if (isUrl(item)) {
    request.get(item, (err, res, body) => {
      if (err) {
        return cb(err)
      }
      cb(null, body)
    })
  } else {
    cb(null, item)
  }
}

module.exports = getBody
