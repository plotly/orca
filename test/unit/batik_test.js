const tap = require('tap')
const sinon = require('sinon')
const path = require('path')
const fs = require('fs')
const childProcess = require('child_process')
const Batik = require('../../src/util/batik')

const { paths } = require('../common')
const SVG_MOCK = fs.readFileSync(path.join(paths.build, '20.svg'))

tap.test('batik.svg2pdf', t => {
  t.test('should convert svg to pdf', t => {
    const batik = new Batik(paths.batik)
    const outPath = path.join(paths.build, 'batik-test.pdf')

    batik.svg2pdf(SVG_MOCK, {}, (err, result) => {
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

  t.test('should remove tmp files after conversion', t => {
    const batik = new Batik(paths.batik)
    const tmpOutPath = path.join(paths.build, 'tmp-out')
    const tmpSvgPath = path.join(paths.build, 'tmp-svg')

    batik.svg2pdf(SVG_MOCK, {id: 'tmp'}, (err, result) => {
      if (err) t.fail(err)

      t.type(result, Buffer)
      t.notOk(fs.existsSync(tmpOutPath), 'clears tmp out file')
      t.notOk(fs.existsSync(tmpSvgPath), 'clears tmp svg file')
      t.end()
    })
  })

  t.test('should error out when batik command fails', t => {
    const batik = new Batik(paths.batik)
    batik.batikBase = 'not gonna work'

    const tmpOutPath = path.join(paths.build, 'tmp-out')
    const tmpSvgPath = path.join(paths.build, 'tmp-svg')

    batik.svg2pdf(SVG_MOCK, {id: 'tmp'}, (err) => {
      t.throws(() => { throw err }, /Command failed/)
      t.notOk(fs.existsSync(tmpOutPath), 'clears tmp out file')
      t.notOk(fs.existsSync(tmpSvgPath), 'clears tmp svg file')
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

tap.test('isJavaInstalled', t => {
  t.afterEach((done) => {
    childProcess.execSync.restore()
    done()
  })

  t.test('should return true when binary execute correctly', t => {
    sinon.stub(childProcess, 'execSync').returns(true)
    t.ok(Batik.isJavaInstalled())
    t.end()
  })

  t.test('should return false when binary does not execute correctly', t => {
    sinon.stub(childProcess, 'execSync').throws()
    t.notOk(Batik.isJavaInstalled())
    t.end()
  })

  t.end()
})
