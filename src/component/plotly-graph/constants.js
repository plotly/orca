module.exports = {
  contentFormat: {
    png: 'image/png',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    pdf: 'application/pdf',
    svg: 'image/svg+xml',
    eps: 'application/postscript'
  },

  statusMsg: {
    400: 'invalid or malformed request syntax',
    530: 'image conversion error',
    525: 'plotly.js error'
  },

  dflt: {
    format: 'png',
    scale: 1,
    width: 700,
    height: 500
  }
}
