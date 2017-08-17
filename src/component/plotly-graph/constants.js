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
    525: 'plotly.js error',
    526: 'plotly.js version 1.11.0 or up required'
  },

  dflt: {
    format: 'png',
    scale: 1,
    width: 700,
    height: 500
  },

  // only used in render for plotly.js < v1.30.0
  imgPrefix: {
    base64: /^data:image\/\w+;base64,/,
    svg: /^data:image\/svg\+xml,/
  },

  mathJaxConfigQuery: '?config=TeX-AMS-MML_SVG'
}
