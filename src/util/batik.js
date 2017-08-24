const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')
const parallel = require('run-parallel')
const series = require('run-series')
const uuid = require('uuid/v4')

const PATH_TO_BUILD = path.join(__dirname, '..', '..', 'build')

/** Node wrapper for Batik
 *
 * See:
 * - https://xmlgraphics.apache.org/batik/tools/rasterizer.html
 * - http://archive.apache.org/dist/xmlgraphics/batik/
 */
class Batik {
  /** Create batik rasterizer instance
   *
   * @param {string} batikJar : path to batik rasterizer jar file
   */
  constructor (batikJar) {
    this.batikJar = path.resolve(batikJar)
    this.javaBase = 'java -jar -XX:+UseParallelGC -server'
    this.batikBase = `${this.javaBase} ${this.batikJar}`
  }

  /** Convert svg to pdf
   *
   * @param {string} svg : svg string to convert
   * @param {object} opts :
   *  - id {string}
   * @param {function} cb
   *  - err {null || error}
   *  - result {buffer}
   */
  svg2pdf (svg, opts, cb) {
    const id = opts.id || uuid()
    const inPath = path.join(PATH_TO_BUILD, id + '-svg')
    const outPath = path.join(PATH_TO_BUILD, id + '-out')
    const cmd = `${this.batikBase} -m application/pdf -d ${outPath} ${inPath}`

    // TODO old batik wrapper had:
    //
    // svg = svg.replace(/(font-family: )('Courier New')/g, '$1\'Liberation mono\'')
    //   .replace(/(font-family: )('Times New Roman')/g, '$1\'Liberation Serif\'')
    //   .replace(/(font-family: )(Arial)/g, '$1\'Liberation Sans\'')
    //   .replace(/(font-family: )(Balto)/g, '$1\'Balto Book\'')
    //   .replace(/(font-family: )(Tahoma)/g, '$1\'Liberation Sans\'');
    //
    // find out why, and check if it's still needed.

    // TODO do we still need this `\ufeff` addition?

    const createTmpFiles = (cb) => parallel([
      (cb) => fs.writeFile(inPath, '\ufeff' + svg, cb),
      (cb) => fs.writeFile(outPath, '', cb)
    ], cb)

    const destroyTmpFiles = (cb) => parallel([
      (cb) => fs.unlink(inPath, cb),
      (cb) => fs.unlink(outPath, cb)
    ], cb)

    series([
      createTmpFiles,
      (cb) => childProcess.exec(cmd, cb),
      (cb) => fs.readFile(outPath, cb)
    ], (err, result) => {
      destroyTmpFiles(() => {
        cb(err, result[2])
      })
    })
  }

  /** Does batik-rasterizer jar file exist?
   * @return {boolean}
   */
  doesBatikJarExist () {
    return fs.existsSync(this.batikJar)
  }

  /** Is java installed?
   * @return {boolean}
   */
  static isJavaInstalled () {
    try {
      childProcess.execSync('java -version', {stdio: 'ignore'})
    } catch (e) {
      return false
    }
    return true
  }
}

module.exports = Batik
