const tap = require('tap')
const { spawn } = require('child_process')
const { paths } = require('../common')

const BASE_ARGS = [
  'graph',
  '--output-dir', paths.build,
  '--verbose'
]

const _spawn = (t, args) => {
  const allArgs = args ? BASE_ARGS.concat(args) : BASE_ARGS

  const subprocess = spawn(paths.bin, allArgs, {
    stdio: ['inherit', 'pipe', 'pipe']
  })

  subprocess.on('error', t.fail)

  return subprocess
}

tap.test('should print help message', t => {
  const shouldPass = ['--help', '-h']

  shouldPass.forEach(d => {
    t.test(`on ${d}`, t => {
      const subprocess = _spawn(t, d)

      subprocess.stdout.on('data', d => {
        t.match(d.toString(), /orca graph/)
        t.match(d.toString(), /Usage/)
        t.end()
      })
    })
  })

  t.end()
})

tap.test('should log message when no input is given', t => {
  const subprocess = _spawn(t, '')

  subprocess.stdout.on('data', d => {
    t.match(d.toString(), /No input given/)
    t.end()
  })
})
