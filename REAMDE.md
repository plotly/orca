
## Stuff we need

- output raw SVG strings (not image data) maybe add `Plotly.serialize` or `Plotly.toSVG`
- mapbox access token
- MathJax !!
    + local or CDN!
- use local plotly.js (found with `pkgUp` or provided path) or CDN (latest or tagged)

- `scale` png in the client
- client module and client `<script>` deps (e.g. plotly.js)

- logging!
    + pass logger as argument
- debug mode!
    + use `assert`
    + https://github.com/electron/devtron
    + https://github.com/sindresorhus/electron-debug/blob/master/index.js
    + https://github.com/sindresorhus/electron-unhandled
- plugin system for renderers and converters

- CLI should support
    + data/layout strings
    + glob of data/layout files
    + glob of URL to data/layout files
    + options: format (png, jpeg, svg, pdf, eps, webp), scale, width/height, encoded(??)
    + don't assume plotly plot payloads (jupyter notebooks are next, animations)

- benchmarks!!
    + https://github.com/electron/asar
- test coverage!!
    + https://github.com/electron/spectron

- should image comparison be a component here? 
    Or a hook in plotly.js after 'plotly-graph' convert.js?
    

## Questions

- Are plot tiles still a thing?
- Should we replace `Batik`


## CLI

### Graph exporter

This thing knows to use _just_ to plotly-graph component on all files

```
plotly-graph-exporter graph graph2 ... --format png --scale 2
```

### Export server

```
plotly-export-server --port 9090
```

Dispatch to one component based on url of request 

```
curl localhost:9090/plotly-graph/

# or 
curl localhost:9090/jupyter-notebook/
```

## API

### Runner

```
var plotlyExporter = require('plotly-exporter')

var runner = plotlyExporter.run({
  component: 'component name' || {/* module object */},
  input: 'path-to-file' || 'glob*' || [],
  
  // other runner options

  // component opts
  opts: {
    pathToPlotlyJS: '' || /* defaults to latest CDN */,
  }
})

runner.on('convert', (result) => {
  fs.writeFile(file, result)

  // do something after convert
})

runner.on('done', () => {
  process.exit(0)   
})
```

### Server

```js
var plotlyExporter = require('plotly-exporter')

var server = plotlyExporter.serve({
  // similar to https://github.com/substack/node-browserify
  // I think ...
  component: [{
    name: 'plotly-graph',
    route: /* default to same as name */,
    opts: {
      pathToPlotlyJS: ''
    }
  }],
  port: 9090,
  logger: () => {} // defaults to console.log
})

server.on('after-convert', (result) => {
  // log something    
})
```

### Nomenclature

- request (or caller) to renderer (evt: ${component.name})
- renderer to converter (evt: ${uid})
- converter to request (or caller)
