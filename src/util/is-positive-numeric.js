const isNumeric = require('fast-isnumeric')

module.exports = function (v) {
  return isNumeric(v) && v > 0
}
