module.exports = {
  bufferOverflowLimit: 1e9,
  statusMsg: {
    200: 'pong',
    401: 'error during request',
    402: 'too many windows are opened',
    404: 'invalid route',
    422: 'json parse error',
    499: 'client closed request before generation complete',
    504: 'window for given route does not exist',
    522: 'client socket timeout'
  },
  dflt: {
    maxNumberOfWindows: 50,
    requestTimeout: 50
  }
}
