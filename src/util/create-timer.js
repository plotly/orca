const NS_PER_SEC = 1e9

function Timer () {
  this.time0 = process.hrtime()
}

Timer.prototype.end = function () {
  const diff = process.hrtime(this.time0)

  return diff[0] * NS_PER_SEC + diff[1]
}

function createTimer () {
  return new Timer()
}

module.exports = createTimer
