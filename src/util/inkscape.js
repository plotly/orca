const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')
const parallel = require('run-parallel')
const series = require('run-series')
const uuid = require('uuid/v4')
const os = require('os')
const PNG = require('pngjs').PNG

const PATH_TO_BUILD = path.join(os.tmpdir(), 'orca-build')
try {
  fs.mkdirSync(PATH_TO_BUILD)
} catch (e) {}

const fullyTransparentColorbarRegexp = /<rect class="cbbg"(\s+[-\w]+="[^"]+")*\s+style="[^"]*fill-opacity: 0;[^"]*"(\s+[-\w]+="[^"]+")*\/>/g
const fullyTransparentRectRegexp = /<rect(\s+[-\w]+="[^"]+")*\s+style="[^"]*stroke-opacity: 0;[^"]*fill-opacity: 0;[^"]*"(\s+[-\w]+="[^"]+")*\/>/g
const transparentFillRectRegexp = /<rect(\s+[-\w]+="[^"]+")*\s+style="[^"]*fill-opacity: 0;[^"]*"(\s+[-\w]+="[^"]+")*\/>/g
const transparentStrokeRectRegexp = /<rect(\s+[-\w]+="[^"]+")*\s+style="[^"]*stroke-opacity: 0;[^"]*"(\s+[-\w]+="[^"]+")*\/>/g
const imgRegexp = /<image\s+xmlns="http:\/\/www.w3.org\/2000\/svg"\s+xlink:href="data:image\/png;base64,([^"]*)"[^>]*>/
const colorbarFillRegexp = /<rect class="cbfill"[^>]*\/>/
const xlinkHrefDataImageRegexp = /xlink:href="data:image\/png;base64,([^"]*)"/

/** Node wrapper for Inkscape
 *
 * $ apt-get install inkscape
 * ... or on OS X:
 * $ brew install inkscape
 *
 * See:
 * - https://linux.die.net/man/1/inkscape
 * - https://en.wikipedia.org/wiki/Inkscape
 */
class Inkscape {
  constructor (pathToInkscape) {
    this.cmdBase = pathToInkscape || 'inkscape'
  }

  /** Convert SVG to EMF
   *
   * @param {buffer} svg : svg data buffer
   * @param {object} opts
   *  - id {string}
   * @param {function} cb
   *  - err {null || error}
   *  - result {buffer}
   */
  svg2emf (svg, opts, cb) {
    const id = opts.id || uuid()
    const inPath = path.join(PATH_TO_BUILD, id + '-svg')
    const outPath = path.join(PATH_TO_BUILD, id + '-emf')
    const cmd = `${this.cmdBase} --file ${inPath} --export-emf ${outPath}`

    const destroyTmpFiles = (cb) => parallel([
      (cb) => fs.unlink(inPath, cb),
      (cb) => fs.unlink(outPath, cb)
    ], cb)

    svg = this.cleanSvg(svg)

    series([
      (cb) => fs.writeFile(inPath, svg, 'utf-8', cb),
      (cb) => childProcess.exec(cmd, cb),
      (cb) => fs.readFile(outPath, cb)
    ], (err, result) => {
      destroyTmpFiles(() => {
        cb(err, result[2])
      })
    })
  }

  cleanSvg (svg) {
    var bgColor = [255, 255, 255]

    // Fix black legends by removing rect.legendtoggle
    svg = svg.replace(/<rect class="legendtoggle"[^>]+>/g, '')

    // Remove colorbar background if it's transparent
    svg = svg.replace(fullyTransparentColorbarRegexp, '')
    // Remove annotation's background if it's compleletely transparent
    svg = svg.replace(fullyTransparentRectRegexp, '')

    // Set fill color to background color if its opacity is 0
    svg = svg.replace(transparentFillRectRegexp, function (match, p) {
      return match.replace(/fill: [^;]*;/, `fill: rgb(${bgColor[0]},${bgColor[1]},${bgColor[2]});`)
    })
    // Set stroke color to background color if its opacity is 0
    svg = svg.replace(transparentStrokeRectRegexp, function (match, p) {
      return match.replace(/stroke: [^;]*;/, `stroke: rgb(${bgColor[0]},${bgColor[1]},${bgColor[2]});`)
    })

    // Fix black background in rasterized images
    svg = svg.replace(imgRegexp, function (match, base64png) {
      var pngBuffer = Buffer.from(base64png, 'base64')
      var image = PNG.sync.read(pngBuffer)

      for (var y = 0; y < image.height; y++) {
        for (var x = 0; x < image.width; x++) {
          var idx = (image.width * y + x) << 2

          var alpha = image.data[idx + 3]
          if (alpha < 255) {
            // Manually do alpha composition (https://en.wikipedia.org/wiki/Alpha_compositing)
            image.data[idx] = image.data[idx] * alpha / 255 + bgColor[0] * (1 - alpha / 255)
            image.data[idx + 1] = image.data[idx + 1] * alpha / 255 + bgColor[1] * (1 - alpha / 255)
            image.data[idx + 2] = image.data[idx + 2] * alpha / 255 + bgColor[2] * (1 - alpha / 255)

            image.data[idx + 3] = 255
          }
        }
      }
      var pngOpaqueBuffer = PNG.sync.write(image)
      return match.replace(xlinkHrefDataImageRegexp, `xlink:href="data:image/png;base64,${pngOpaqueBuffer.toString('base64')}"`)
    })

    // Inkscape doesn't convert well gradientUnits="objectBoundingBox" into EMF
    svg.replace(colorbarFillRegexp, function (match) {
      // var width = match.match(/width="(\d+)"/)[1]
      var height = match.match(/height="(\d+)"/)[1]
      var gradientId = match.match(/url\('#([^']*)'\)/)

      if (gradientId) {
        gradientId = gradientId[1]
        var gradientIdRegexp = new RegExp(`<linearGradient[^>]*id="${gradientId}"[^>]*>`)
        svg = svg.replace(gradientIdRegexp, function (m) {
          return `<linearGradient gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="${height}" y2="0" id="${gradientId}">`
        })
      }

      return false
    })
    
    return svg
  }

  /** Is Inkscape installed?
   * @return {boolean}
   */
  static isInkscapeInstalled () {
    try {
      childProcess.execSync(`${this.cmdBase} --version`, {
        stdio: 'ignore'
      })
    } catch (e) {
      return false
    }
    return true
  }
}

module.exports = Inkscape
