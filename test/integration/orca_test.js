const tap = require('tap')
const { spawn } = require('child_process')
const { paths } = require('../common')
const pkg = require('../../package.json')

const _spawn = (t, args) => {
  const subprocess = spawn(paths.bin, args, {
    stdio: ['inherit', 'pipe', 'pipe']
  })

  subprocess.on('error', t.fail)

  return subprocess
}

tap.test('should print version', t => {
  const shouldPass = ['--version', '-v']

  shouldPass.forEach(d => {
    t.test(`on ${d}`, t => {
      const subprocess = _spawn(t, [d])

      subprocess.stdout.on('data', d => {
        t.equal(d.toString(), pkg.version + '\n')
        t.end()
      })
    })
  })

  t.end()
})

tap.test('should print help message', t => {
  const shouldPass = [[], ['--help'], ['-h']]

  shouldPass.forEach(d => {
    t.test(`on ${d}`, t => {
      const subprocess = _spawn(t, d)

      subprocess.stdout.on('data', d => {
        t.match(d.toString(), /Plotly's image-exporting utilities/)
        t.match(d.toString(), /Usage/)
        t.end()
      })
    })
  })

  t.end()
})
