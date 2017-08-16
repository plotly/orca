const tap = require('tap')
const { spawn } = require('child_process')
const path = require('path')
const pkg = require('../../package.json')

const ROOT_PATH = path.join(__dirname, '..', '..')
const BIN = path.join(ROOT_PATH, 'bin', 'plotly-graph-exporter.js')
const BASE_ARGS = [
  '--output-dir', path.join(ROOT_PATH, 'build'),
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

tap.test('should print export info on success', t => {
  const input = '{"data":[{"y":[1,2,1]}],"layout":{"title":"tester"}}'
  const subprocess = _spawn(t, input)

  const matches = [
    /^exported fig/,
    /done with code 200/
  ]

  let i = 0

  subprocess.stdout.on('data', d => {
    t.match(d.toString(), matches[i], `msg ${i}`)
    i++
  })

  subprocess.stderr.on('data', d => {
    t.fail(d, 'unwanted msg to stderr')
  })
})
