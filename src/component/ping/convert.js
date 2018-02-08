function convert (info, opts, reply) {
  const result = {
    body: 'pong\n',
    head: {}
  }

  reply(null, result)
}

module.exports = convert
