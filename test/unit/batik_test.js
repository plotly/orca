const tap = require('tap')
const sinon = require('sinon')
const path = require('path')
const fs = require('fs')
const childProcess = require('child_process')
const imageSize = require('image-size')
const Batik = require('../../src/util/batik')

const { paths } = require('../common')
const SVG_MOCK = fs.readFileSync(path.join(paths.build, '20.svg'))

tap.test('Batik constructor:', t => {
  t.test('', t => {
    const batik = new Batik(paths.batik)
    t.type(batik.convertSVG, 'function')
    t.end()
  })

  t.end()
})

tap.test('batik.convertSVG', t => {
  t.test('should convert svg to pdf', t => {
    const batik = new Batik(paths.batik)
    const outPath = path.join(paths.build, 'batik-test.pdf')

    batik.convertSVG(SVG_MOCK, {format: 'pdf'}, (err, result) => {
      if (err) t.fail(err)
      t.type(result, Buffer)

      fs.writeFile(outPath, result, (err) => {
        if (err) t.fail(err)

        const size = fs.statSync(outPath).size
        t.ok(size > 5e4, 'min pdf file size')
        t.ok(size < 7e4, 'max pdf file size')
        t.end()
      })
    })
  })

  t.test('should convert svg to eps', t => {
    const batik = new Batik(paths.batik)
    const outPath = path.join(paths.build, 'batik-test.eps')

    batik.convertSVG(SVG_MOCK, {format: 'eps'}, (err, result) => {
      if (err) t.fail(err)
      t.type(result, Buffer)

      fs.writeFile(outPath, result, (err) => {
        if (err) t.fail(err)

        const size = fs.statSync(outPath).size
        t.ok(size > 1e6, 'min eps file size')
        t.ok(size < 2e6, 'max eps file size')
        t.end()
      })
    })
  })

  t.test('should convert svg to png', t => {
    const batik = new Batik(paths.batik)
    const outPath = path.join(paths.build, 'batik-test.png')

    batik.convertSVG(SVG_MOCK, {format: 'png'}, (err, result) => {
      if (err) t.fail(err)
      t.type(result, Buffer)

      fs.writeFile(outPath, result, (err) => {
        if (err) t.fail(err)

        const {width, height} = imageSize(outPath)
        t.equal(width, 750, 'png width')
        t.equal(height, 600, 'png height')
        t.end()
      })
    })
  })

  t.test('should rescale svg into png', t => {
    const batik = new Batik(paths.batik)
    const outPath = path.join(paths.build, 'batik-test.png')

    batik.convertSVG(SVG_MOCK, {format: 'png', width: 200, height: 200}, (err, result) => {
      if (err) t.fail(err)
      t.type(result, Buffer)

      fs.writeFile(outPath, result, (err) => {
        if (err) t.fail(err)

        const {width, height} = imageSize(outPath)
        t.equal(width, 200, 'png width')
        t.equal(height, 200, 'png height')
        t.end()
      })
    })
  })

  t.test('should error out when batik command fails', t => {
    const batik = new Batik(paths.batik)
    batik.batikBase = 'not gonna work'

    batik.convertSVG(SVG_MOCK, {}, (err) => {
      t.throws(() => { throw err }, /problem while executing batik command/)
      t.end()
    })
  })

  t.test('should error out when pdftops command fails', t => {
    const batik = new Batik(paths.batik)
    batik.pdftopsBase = 'not gonna work'

    batik.convertSVG(SVG_MOCK, {format: 'eps'}, (err) => {
      t.throws(() => { throw err }, /problem while executing pdftops command/)
      t.end()
    })
  })

  t.test('should error out when something goes wrong when initializing files', t => {
    sinon.stub(fs, 'writeFile').yields(true)

    const batik = new Batik(paths.batik)
    const outPath = path.join(paths.build, 'tmp-out')
    const svgPath = path.join(paths.build, 'tmp-svg')

    batik.convertSVG(SVG_MOCK, {id: 'tmp'}, (err) => {
      t.throws(() => { throw err }, /problem while initializing temporary files/)
      t.notOk(fs.existsSync(outPath), 'clears tmp out file')
      t.notOk(fs.existsSync(svgPath), 'clears tmp svg file')

      fs.writeFile.restore()
      t.end()
    })
  })

  t.test('should error out when something goes wrong when reading output files', t => {
    sinon.stub(fs, 'readFile').yields(true)

    const batik = new Batik(paths.batik)
    const outPath = path.join(paths.build, 'tmp-out')
    const svgPath = path.join(paths.build, 'tmp-svg')

    batik.convertSVG(SVG_MOCK, {id: 'tmp'}, (err) => {
      t.throws(() => { throw err }, /problem while reading output file/)
      t.notOk(fs.existsSync(outPath), 'clears tmp out file')
      t.notOk(fs.existsSync(svgPath), 'clears tmp svg file')

      fs.readFile.restore()
      t.end()
    })
  })

  t.test('should error out when something goes wrong when removing temporary files', t => {
    sinon.stub(fs, 'unlink').yields(true)

    const batik = new Batik(paths.batik)
    const outPath = path.join(paths.build, 'tmp-out')
    const svgPath = path.join(paths.build, 'tmp-svg')

    batik.convertSVG(SVG_MOCK, {id: 'tmp'}, (err) => {
      t.throws(() => { throw err }, /problem while removing temporary files/)
      t.ok(fs.existsSync(outPath), 'cannot clear tmp out file')
      t.ok(fs.existsSync(svgPath), 'cannot clears tmp svg file')

      fs.unlink.restore()
      fs.unlinkSync(outPath)
      fs.unlinkSync(svgPath)
      t.notOk(fs.existsSync(outPath), 'clears tmp out file')
      t.notOk(fs.existsSync(svgPath), 'clears tmp svg file')

      t.end()
    })
  })

  t.end()
})

tap.test('doesBatikJarExist:', t => {
  t.test('should return true when it does exists', t => {
    const batik = new Batik(paths.batik)
    t.ok(batik.doesBatikJarExist())
    t.end()
  })

  t.test('should return false when it does not exists', t => {
    const batik = new Batik('not gonna work')
    t.notOk(batik.doesBatikJarExist())
    t.end()
  })
  t.end()
})

tap.test('isJavaInstalled / isPdftopsInstalled:', t => {
  t.afterEach((done) => {
    childProcess.execSync.restore()
    done()
  })

  t.test('should return true when binary execute correctly', t => {
    sinon.stub(childProcess, 'execSync').returns(true)
    t.ok(Batik.isJavaInstalled())
    t.ok(Batik.isPdftopsInstalled())
    t.end()
  })

  t.test('should return false when binary does not execute correctly', t => {
    sinon.stub(childProcess, 'execSync').throws()
    t.notOk(Batik.isJavaInstalled())
    t.notOk(Batik.isPdftopsInstalled())
    t.end()
  })

  t.end()
})
