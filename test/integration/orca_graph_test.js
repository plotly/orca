const tap = require('tap')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const { paths } = require('../common')

const BASE_ARGS = ['graph', '--verbose']
const DUMMY_DATA = '{ "data": [{"y": [1,2,1]}] }'

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

tap.test('should output to fig.png when --output is not set', t => {
  const subprocess = _spawn(t, DUMMY_DATA)
  const p = path.join(process.cwd(), 'fig.png')

  subprocess.on('close', code => {
    t.same(code, 0)
    t.ok(fs.existsSync(p))
    fs.unlinkSync(p)
    t.end()
  })
})

tap.test('should respect --output when set (just filename case)', t => {
  const subprocess = _spawn(t, [DUMMY_DATA, '--output=graph.png'])
  const p = path.join(process.cwd(), 'graph.png')

  subprocess.on('close', code => {
    t.same(code, 0)
    t.ok(fs.existsSync(p))
    fs.unlinkSync(p)
    t.end()
  })
})

tap.test('should respect --output when set (path/to/filename case)', t => {
  const subprocess = _spawn(t, [DUMMY_DATA, '--output=build/tmp/graph.png'])
  const p = path.join(process.cwd(), 'build', 'tmp', 'graph.png')

  subprocess.on('close', code => {
    t.same(code, 0)
    t.ok(fs.existsSync(p))
    fs.unlinkSync(p)
    t.end()
  })
})

tap.test('should respect --output-dir when set', t => {
  const subprocess = _spawn(t, [DUMMY_DATA, '--output-dir=build'])
  const p = path.join(process.cwd(), 'build', 'fig.png')

  subprocess.on('close', code => {
    t.same(code, 0)
    t.ok(fs.existsSync(p))
    fs.unlinkSync(p)
    t.end()
  })
})

tap.test('should respect --output (filename) and --output-dir when set', t => {
  const subprocess = _spawn(t, [DUMMY_DATA, '--output-dir=build', '--output=graph.png'])
  const p = path.join(process.cwd(), 'build', 'graph.png')

  subprocess.on('close', code => {
    t.same(code, 0)
    t.ok(fs.existsSync(p))
    fs.unlinkSync(p)
    t.end()
  })
})

tap.test('should respect --output (path/to/filename) and --output-dir when set', t => {
  const subprocess = _spawn(t, [DUMMY_DATA, '--output-dir=build', '--output=tmp/graph.png'])
  const p = path.join(process.cwd(), 'build', 'tmp', 'graph.png')

  subprocess.on('close', code => {
    t.same(code, 0)
    t.ok(fs.existsSync(p))
    fs.unlinkSync(p)
    t.end()
  })
})
