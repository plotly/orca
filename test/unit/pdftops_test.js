const tap = require('tap')
const sinon = require('sinon')
const path = require('path')
const fs = require('fs')
const readChunk = require('read-chunk')
const fileType = require('file-type')
const childProcess = require('child_process')
const Pdftops = require('../../src/util/pdftops')

const { paths, mocks } = require('../common')

tap.test('pdftops.pdf2eps', t => {
  t.test('should convert pdf to eps', t => {
    const pdftops = new Pdftops()
    const outPath = path.join(paths.build, 'pdftops-test.eps')

    pdftops.pdf2eps(mocks.pdf, {}, (err, result) => {
      if (err) t.fail(err)
      t.type(result, Buffer)

      fs.writeFile(outPath, result, (err) => {
        if (err) t.fail(err)

        const size = fs.statSync(outPath).size
        t.ok(size > 5e4, 'min pdf file size')
        t.ok(size < 4e5, 'max pdf file size')
        t.ok(fileType(readChunk.sync(outPath, 0, 4100)).mime === 'application/postscript', 'postscript content')
        t.end()
      })
    })
  })

  t.test('should remove tmp files after conversion', t => {
    const pdftops = new Pdftops()
    const tmpOutPath = path.join(paths.build, 'tmp-eps')
    const tmpSvgPath = path.join(paths.build, 'tmp-pdf')

    pdftops.pdf2eps(mocks.pdf, { id: 'tmp' }, (err, result) => {
      if (err) t.fail(err)

      t.type(result, Buffer)
      t.notOk(fs.existsSync(tmpOutPath), 'clears tmp eps file')
      t.notOk(fs.existsSync(tmpSvgPath), 'clears tmp pdf file')
      t.end()
    })
  })

  t.test('should error out when pdftops command fails', t => {
    const pdftops = new Pdftops('not gonna work')

    const tmpOutPath = path.join(paths.build, 'tmp-eps')
    const tmpSvgPath = path.join(paths.build, 'tmp-pdf')

    pdftops.pdf2eps(mocks.pdf, { id: 'tmp' }, (err) => {
      t.throws(() => { throw err }, /Command failed/)
      t.notOk(fs.existsSync(tmpOutPath), 'clears tmp eps file')
      t.notOk(fs.existsSync(tmpSvgPath), 'clears tmp pdf file')
      t.end()
    })
  })

  t.end()
})

tap.test('isPdftopsInstalled', t => {
  t.afterEach((done) => {
    childProcess.execSync.restore()
    done()
  })

  t.test('should return true when binary execute correctly', t => {
    sinon.stub(childProcess, 'execSync').returns(true)
    t.ok(Pdftops.isPdftopsInstalled())
    t.end()
  })

  t.test('should return false when binary does not execute correctly', t => {
    sinon.stub(childProcess, 'execSync').throws()
    t.notOk(Pdftops.isPdftopsInstalled())
    t.end()
  })

  t.end()
})
