const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')
const parallel = require('run-parallel')
const series = require('run-series')
const uuid = require('uuid/v4')
const os = require('os')

const PATH_TO_BUILD = path.join(os.tmpdir(), 'orca-build')
try {
  fs.mkdirSync(PATH_TO_BUILD)
} catch (e) {}

/** Node wrapper for pdftops
 *
 * $ apt-get poppler-utils
 * ... or on OS X:
 * $ brew install poppler
 *
 * See:
 * - https://linux.die.net/man/1/pdftops
 * - https://en.wikipedia.org/wiki/Poppler_(software)#poppler-utils
 */
class Pdftops {
  constructor (pathToPdftops) {
    this.cmdBase = pathToPdftops || 'pdftops'
  }

  /** Convert PDF to EPS
   *
   * @param {buffer} pdf : pdf data buffer
   * @param {object} opts
   *  - id {string}
   * @param {function} cb
   *  - err {null || error}
   *  - result {buffer}
   */
  pdf2eps (pdf, opts, cb) {
    const id = opts.id || uuid()
    const inPath = path.join(PATH_TO_BUILD, id + '-pdf')
    const outPath = path.join(PATH_TO_BUILD, id + '-eps')
    const cmd = `${this.cmdBase} -eps ${inPath} ${outPath}`

    const destroyTmpFiles = (cb) => parallel([
      (cb) => fs.unlink(inPath, cb),
      (cb) => fs.unlink(outPath, cb)
    ], cb)

    series([
      (cb) => fs.writeFile(inPath, pdf, 'utf-8', cb),
      (cb) => childProcess.exec(cmd, cb),
      (cb) => fs.readFile(outPath, cb)
    ], (err, result) => {
      destroyTmpFiles(() => {
        cb(err, result[2])
      })
    })
  }

  /** Is pdftops installed?
   * @return {boolean}
   */
  static isPdftopsInstalled () {
    try {
      childProcess.execSync(`${this.cmdBase} -v`, { stdio: 'ignore' })
    } catch (e) {
      return false
    }
    return true
  }
}

module.exports = Pdftops
