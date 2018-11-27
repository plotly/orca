const tap = require('tap')
const sinon = require('sinon')
const path = require('path')
const fs = require('fs')
const childProcess = require('child_process')
const Inkscape = require('../../src/util/inkscape')

const { paths, mocks } = require('../common')

tap.test('inkscape.svg2emf', t => {
  t.test('should convert svg to emf', t => {
    const inkscape = new Inkscape()
    const outPath = path.join(paths.build, 'inkscape-test.emf')

    inkscape.svg2emf(mocks.svg, {}, (err, result) => {
      if (err) t.fail(err)
      t.type(result, Buffer)

      fs.writeFile(outPath, result, (err) => {
        if (err) t.fail(err)

        const size = fs.statSync(outPath).size
        t.ok(size > 9e4, 'min emf file size')
        t.end()
      })
    })
  })

  t.test('should remove tmp files after conversion', t => {
    const inkscape = new Inkscape()
    const tmpOutPath = path.join(paths.build, 'tmp-emf')
    const tmpSvgPath = path.join(paths.build, 'tmp-svg')

    inkscape.svg2emf(mocks.svg, {id: 'tmp'}, (err, result) => {
      if (err) t.fail(err)

      t.type(result, Buffer)
      t.notOk(fs.existsSync(tmpOutPath), 'clears tmp emf file')
      t.notOk(fs.existsSync(tmpSvgPath), 'clears tmp svg file')
      t.end()
    })
  })

  t.test('should error out when inkscape command fails', t => {
    const inkscape = new Inkscape('not gonna work')

    const tmpOutPath = path.join(paths.build, 'tmp-emf')
    const tmpSvgPath = path.join(paths.build, 'tmp-svg')

    inkscape.svg2emf(mocks.svg, {id: 'tmp'}, (err) => {
      t.throws(() => { throw err }, /Command failed/)
      t.notOk(fs.existsSync(tmpOutPath), 'clears tmp emf file')
      t.notOk(fs.existsSync(tmpSvgPath), 'clears tmp svg file')
      t.end()
    })
  })

  t.end()
})

tap.test('isInkscapeInstalled', t => {
  t.afterEach((done) => {
    childProcess.execSync.restore()
    done()
  })

  t.test('should return true when binary execute correctly', t => {
    sinon.stub(childProcess, 'execSync').returns(true)
    t.ok(Inkscape.isInkscapeInstalled())
    t.end()
  })

  t.test('should return false when binary does not execute correctly', t => {
    sinon.stub(childProcess, 'execSync').throws()
    t.notOk(Inkscape.isInkscapeInstalled())
    t.end()
  })

  t.end()
})
