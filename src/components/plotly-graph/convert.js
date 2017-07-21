const fs = require('fs')

module.exports = function (event, info, done) {
  switch(info.code) {
    case 200:
      const buf = new Buffer(info.imgData, 'base64')
      const fileName = `${__dirname}/../../../fig.png`

      fs.writeFile(fileName, buf, (err) => {
        if (err) throw err
        done(fileName)
      })
      break
    case 525:
      console.warn(`plotly.js error: ${arg.msg}`)
      done(fileName)
      break
  }
}
