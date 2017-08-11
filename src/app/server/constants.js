module.exports = {
  bufferOverflowLimit: 1e9,
  requestTimeout: 50000,
  statusMsg: {
    200: 'pong',
    401: 'error during request',
    499: 'client closed request before generation complete',
    404: 'invalid route',
    422: 'json parse error',
    504: 'window for given route does not exist',
    522: 'client socket timeout'
  }
}
