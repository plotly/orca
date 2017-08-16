const tap = require('tap')
const path = require('path')
const fs = require('fs')
const Batik = require('../../src/util/batik')

const PATH_TO_BUILD = path.join(__dirname, '..', '..', 'build')
const PATH_TO_JAR = path.join(PATH_TO_BUILD, 'batik-1.7', 'batik-rasterizer.jar')
const SVG_MOCK = fs.readFileSync(path.join(PATH_TO_BUILD, '20.svg'))

tap.test('Batik constructor:', t => {
  t.test('', t => {
    const batik = new Batik(PATH_TO_JAR)
    t.type(batik.convertSVG, 'function')
    t.end()
  })

  t.end()
})

tap.test('batik.convertSVG', t => {
  t.test('should convert svg to pdf', t => {
    const batik = new Batik(PATH_TO_JAR)
    const outPath = path.join(PATH_TO_BUILD, 'batik-test.pdf')

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
    const batik = new Batik(PATH_TO_JAR)
    const outPath = path.join(PATH_TO_BUILD, 'batik-test.eps')

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

  t.test('should error out when batik command fails', t => {
    const batik = new Batik(PATH_TO_JAR)
    batik.cmdBase = 'not gonna work'

    batik.convertSVG(SVG_MOCK, {}, (err) => {
      t.throws(() => { throw err }, /problem while executing batik command/)
      t.end()
    })
  })

  t.test('should error out when batik command fails', t => {
    const batik = new Batik(PATH_TO_JAR)
    batik.cmdBase = 'not gonna work'

    batik.convertSVG(SVG_MOCK, {}, (err) => {
      t.throws(() => { throw err }, /problem while executing batik command/)
      t.end()
    })
  })

  t.end()
})

tap.test('doesBatikJarExist:', t => {
  t.test('should return true when it does exists', t => {
    const batik = new Batik(PATH_TO_BUILD)
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
