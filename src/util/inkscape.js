const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')
const parallel = require('run-parallel')
const series = require('run-series')
const uuid = require('uuid/v4')
const os = require('os')
const PNG = require('pngjs').PNG
const semver = require('semver')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const tinycolor = require('tinycolor2')

const PATH_TO_BUILD = path.join(os.tmpdir(), 'orca-build')
try {
  fs.mkdirSync(PATH_TO_BUILD)
} catch (e) {}

const fillUrl = /(^|; )fill: url\('#([^']*)'\);/
const fillRgbaColor = /(^|; )fill: rgba\(([^)]*)\);/
const fillOpacityZero = /(^|\s*)fill-opacity: 0;/
const strokeOpacityZero = /(^|; )stroke-opacity: 0;/
const opacityZero = /(^|; )opacity: 0;/

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

    // Get background color from figure's definition
    var bgColor
    if ((opts.figure.layout || {}).paper_bgcolor) {
      var color = tinycolor(opts.figure.layout.paper_bgcolor)
      color = color.toRgb()
      bgColor = [color.r, color.g, color.b]
    } else {
      bgColor = [255, 255, 255]
    }
    svg = this.cleanSvg(svg, bgColor)

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

  cleanSvg (svg, bgColor) {
    const fragment = JSDOM.fragment(svg)

    // Remove path and rectangles that are compleletely transparent
    fragment.querySelectorAll('rect, path').forEach(function (node) {
      var style = node.getAttribute('style')
      if (style && (
        (style.match(fillOpacityZero) && style.match(strokeOpacityZero)) ||
        style.match(opacityZero)
      )) node.remove()
    })

    // Set fill color to background color if its fill-opacity is 0 but stroke-opacity isn't 0
    fragment.querySelectorAll('rect').forEach(function (node) {
      var style = node.getAttribute('style')
      if (!style) return
      var m = style.match(fillOpacityZero)

      if (m) {
        var sep = m[1]
        var rgbFill = `${sep}fill: rgb(${bgColor[0]},${bgColor[1]},${bgColor[2]});`
        style = style.replace(m[0], rgbFill)
        node.setAttribute('style', style)
      }
    })

    // Fix black legends by removing rect.legendtoggle
    // regexp: svg = svg.replace(/<rect class="legendtoggle"[^>]+>/g, '')
    fragment.querySelectorAll('rect.legendtoggle').forEach(node => node.remove())

    // Remove colorbar background if it's transparent
    fragment.querySelectorAll('rect.cbbg').forEach(function (node) {
      var style = node.getAttribute('style')
      if (style && style.match(fillOpacityZero)) node.remove()
    })

    // Fix fill in colorbars
    fragment.querySelectorAll('rect.cbfill').forEach(function (node) {
      var style = node.getAttribute('style')
      if (style && style.match(fillUrl)) {
        var gradientId = style.match(fillUrl)[2]

        var el = fragment.getElementById(gradientId)
        // Inkscape doesn't deal well with gradientUnits="objectBoundingBox"
        el.setAttribute('gradientUnits', 'userSpaceOnUse')
        var height = node.getAttribute('height')
        el.setAttribute('y1', height)
      }
    })

    // Fix path with rgba color for fill
    fragment.querySelectorAll('path').forEach(function (node) {
      var style = node.getAttribute('style')
      if (!style) return
      var m = style.match(fillRgbaColor)
      if (m) {
        var sep = m[1]
        var rgba = m[2].split(',')
        if (rgba[3] === 0) {
          node.remove()
        } else {
          var rgbFill = `${sep}fill: rgb(${rgba.slice(0, 3).join(',')})`
          style = style.replace(m[0], rgbFill)
          node.setAttribute('style', style)
        }
      }
    })

    // Fix black background in rasterized images (WebGL)
    fragment.querySelectorAll('image').forEach(function (node) {
      var dataType = 'data:image/png;base64'
      var href = node.getAttribute('xlink:href')
      var parts = href.split(',')
      if (parts[0] === dataType) {
        var pngBuffer = Buffer.from(parts[1], 'base64')
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
        node.setAttribute('xlink:href', dataType + ',' + pngOpaqueBuffer.toString('base64'))
      }
    })
    svg = fragment.firstChild.outerHTML

    return svg
  }

  /** Is Inkscape installed?
   * @return {boolean}
   */
  isInstalled () {
    try {
      childProcess.execSync(`${this.cmdBase} --version`, {
        stdio: 'ignore'
      })
    } catch (e) {
      return false
    }
    return true
  }

  /** Returns inkscape version
   * @return {string}
   */
  Version () {
    try {
      var out = childProcess.execSync(`${this.cmdBase} --version`)
      out = out.toString()
      var found = out.match(/Inkscape (\d+\.\d+\.\d+)/)
      return found[1]
    } catch (e) {
      return ''
    }
  }

  CheckInstallation () {
    if (!this.isInstalled()) {
      throw new Error('Inkscape is not installed')
    }

    if (!this.Version() || !semver.gte(this.Version(), '0.92.0')) {
      throw new Error('Inkscape version should be greater than or equal to 0.92.0')
    }
  }
}

module.exports = Inkscape
