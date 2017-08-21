const path = require('path')

const paths = {}
const urls = {}

paths.root = path.join(__dirname, '..')
paths.build = path.join(paths.root, 'build')
paths.batik = process.env.BATIK_RASTERIZER_PATH || path.join(paths.build, 'batik-1.7', 'batik-rasterizer.jar')
paths.readme = path.join(paths.root, 'README.md')
paths.pkg = path.join(paths.root, 'package.json')
paths.glob = path.join(paths.root, 'src', 'util', '*')

urls.dummy = 'http://dummy.url'
urls.plotlyGraphMock = 'https://raw.githubusercontent.com/plotly/plotly.js/master/test/image/mocks/20.json'

module.exports = {
  paths: paths,
  urls: urls
}
