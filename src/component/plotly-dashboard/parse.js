function parse (body, opts, sendToRenderer) {
  const result = {}

  const errorOut = (code) => {
    result.msg = 'missing dashboard url'
    sendToRenderer(code, result)
  }

  result.fid = typeof body.fid === 'string' ? body.fid : null

  if (typeof body.url === 'string') {
    result.url = body.url
  } else {
    errorOut(400)
  }

  result.width = body.width || 800
  result.height = body.height || 600

  sendToRenderer(null, result)
}

module.exports = parse
