const fs = require('fs')
const path = require('path')
const { exec, execSync } = require('child_process')
const parallel = require('run-parallel')
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

    this.bg = '255.255.255.255'
    this.dpi = '300'
    this.javaBase = 'java -jar -XX:+UseParallelGC -server'
    this.cmdBase = `${this.javaBase} ${this.batikJar}`
  }

  /** Convert svg input
   *
   * @param {string} svg : svg string to convert
   * @param {object} opts :
   *  - id {string}
   *  - format {string}
   *  - width {numeric}
   *  - height {numeric}
   * @param {function} cb
   *  - err {null || error}
   *  - result {buffer}
   */
  convertSVG (svg, opts, cb) {
    const id = opts.id || uuid()
    const format = opts.format || 'pdf'
    const width = opts.width
    const height = opts.height
    const isEPS = format === 'eps'

    // TODO old batik wrapper had:
    //
    // svg = svg.replace(/(font-family: )('Courier New')/g, '$1\'Liberation mono\'')
    //   .replace(/(font-family: )('Times New Roman')/g, '$1\'Liberation Serif\'')
    //   .replace(/(font-family: )(Arial)/g, '$1\'Liberation Sans\'')
    //   .replace(/(font-family: )(Balto)/g, '$1\'Balto Book\'')
    //   .replace(/(font-family: )(Tahoma)/g, '$1\'Liberation Sans\'');
    //
    // find out why, and check if it's still needed.

    const lookup = {
      out: tmpFile(id + '-out', ''),
      // TODO do we still need this `\ufeff` addition?
      svg: tmpFile(id + '-svg', '\ufeff' + svg)
    }

    if (isEPS) {
      lookup.eps = tmpFile(id + '-eps', '')
    }

    const fileNames = Object.keys(lookup)
    const createTasks = fileNames.map(k => lookup[k].create)
    const destroyTasks = fileNames.map(k => lookup[k].destroy)

    let args

    switch (format) {
      case 'pdf':
      case 'eps':
        args = `-m application/pdf`
        break
      default:
        args = `-bg ${this.bg} -dpi ${this.dpi}`
        if (width) args += `-w ${width}`
        if (height) args += `-h ${height}`
    }

    const done = (err, out) => parallel(destroyTasks, (err2) => {
      if (err) {
        return cb(err)
      }
      if (err2) {
        return cb(new Error('problem while removing temporary files'))
      }
      cb(null, out)
    })

    const toBuffer = (outPath) => {
      fs.readFile(outPath, (err, buf) => {
        if (err) {
          return done(new Error('problem while reading output file'))
        }
        done(null, buf)
      })
    }

    // go!
    parallel(createTasks, (err) => {
      if (err) {
        return done(new Error('problem while initializing temporary files'))
      }

      exec(`${this.cmdBase} ${args} -d ${lookup.out.path} ${lookup.svg.path}`, (err) => {
        if (err) {
          return done(new Error('problem while executing batik command'))
        }

        if (isEPS) {
          exec(`pdftops -eps ${lookup.out.path} ${lookup.eps.path}`, (err) => {
            if (err) {
              return done(new Error('problem with executing pdtops command'))
            }
            toBuffer(lookup.eps.path)
          })
        } else {
          toBuffer(lookup.out.path)
        }
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
      execSync('java -version', {stdio: 'silent'})
    } catch (e) {
      return false
    }
    return true
  }

  /** Is pdftops installed?
   * @return {boolean}
   */
  static isPdftopsInstalled () {
    try {
      execSync('pdftops', {stdio: 'silent'})
    } catch (e) {
      return false
    }
    return true
  }
}

function tmpFile (fileName, content) {
  var pathToFile = path.join(PATH_TO_BUILD, fileName)

  return {
    path: pathToFile,
    create: (cb) => fs.writeFile(pathToFile, content, 'utf8', cb),
    destroy: (cb) => fs.unlink(pathToFile, cb)
  }
}

module.exports = Batik
