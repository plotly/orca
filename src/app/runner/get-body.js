const fs = require('fs')
const isUrl = require('is-url')
const isPlainObj = require('is-plain-obj')
const request = require('request')

/**
 * @param {string} item :
 * @param {function} cb :
 *  - err
 *  - body
 */
function getBody (item, cb) {
  let p
  let done

  // if item is object and has 'figure' key,
  // only parse its 'figure' value and accumulate it with item
  // to form body object
  if (isPlainObj(item) && item.figure) {
    p = item.figure
    done = (err, _figure) => {
      let figure

      try {
        figure = JSON.parse(_figure)
      } catch (e) {
        return cb(e)
      }

      const body = Object.assign({}, item, { figure: figure })
      cb(err, body)
    }
  } else {
    p = item
    done = cb
  }

  if (fs.existsSync(p)) {
    fs.readFile(p, 'utf-8', done)
  } else if (fs.existsSync(p + '.json')) {
    fs.readFile(p + '.json', 'utf-8', done)
  } else if (isUrl(p)) {
    request.get(p, (err, res, body) => {
      if (err) {
        return done(err)
      }
      done(null, body)
    })
  } else {
    done(null, item)
  }
}

module.exports = getBody
