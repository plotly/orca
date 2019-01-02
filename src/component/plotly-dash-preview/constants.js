const pixelsInInch = 96
const micronsInInch = 25400

module.exports = {
  minInterval: 500,
  maxRenderingTries: 100,
  pixelsInMicron: pixelsInInch / micronsInInch,
  sizeMapping: {
    'A3': { 'width': 11.7 * pixelsInInch, 'height': 16.5 * pixelsInInch },
    'A4': { 'width': 8.3 * pixelsInInch, 'height': 11.7 * pixelsInInch },
    'A5': { 'width': 5.8 * pixelsInInch, 'height': 8.3 * pixelsInInch },
    'Letter': { 'width': 8.5 * pixelsInInch, 'height': 11 * pixelsInInch },
    'Legal': { 'width': 8.5 * pixelsInInch, 'height': 14 * pixelsInInch },
    'Tabloid': { 'width': 11 * pixelsInInch, 'height': 17 * pixelsInInch }
  },
  statusMsg: {
    525: 'dash preview generation failed',
    526: 'dash preview generation timed out'
  }
}
