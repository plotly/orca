const tap = require('tap')
const { spawn } = require('child_process')
const path = require('path')
const pkg = require('../../package.json')
const { paths } = require('../common')

const ROOT_PATH = path.join(__dirname, '..', '..')
const BIN = path.join(ROOT_PATH, 'bin', 'orca.js')
const BASE_ARGS = [
  '--output-dir', path.join(paths.build),
  '--verbose'
]

const _spawn = (t, args) => {
  const subprocess = spawn(BIN, BASE_ARGS.concat(args), {
    stdio: ['inherit', 'pipe', 'pipe']
  })

  subprocess.on('error', t.fail)
  subprocess.on('close', t.end)

  return subprocess
}

tap.test('should print version', t => {
  const shouldPass = ['--version', '-v']

  shouldPass.forEach(d => {
    t.test(`on ${d}`, t => {
      const subprocess = _spawn(t, d)

      subprocess.stdout.on('data', d => {
        t.equal(d.toString(), pkg.version + '\n')
      })
    })
  })

  t.end()
})

tap.test('should print help message', t => {
  const shouldPass = ['--help', '-h']

  shouldPass.forEach(d => {
    t.test(`on ${d}`, t => {
      const subprocess = _spawn(t, d)

      subprocess.stdout.on('data', d => {
        t.match(d.toString(), /Usage/)
      })
    })
  })

  t.end()
})
