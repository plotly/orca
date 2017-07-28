## Stuff we need

- output raw SVG strings (not image data) maybe add `Plotly.serialize` or `Plotly.toSVG`
- `scale` png in the client

- MathJax !!
    + local or CDN!

- logging!
    + pass logger (e.g. bunyan) as argument or listen to events?

- debug mode!
    + https://github.com/electron/devtron
    + https://github.com/sindresorhus/electron-debug/blob/master/index.js
    + https://github.com/sindresorhus/electron-unhandled

- CLI should support
    + options: format (png, jpeg, svg, pdf, eps, webp), scale, width/height, encoded(??)
    + don't assume plotly plot payloads (jupyter notebooks are next, animations)

- benchmarks!!
    + https://github.com/electron/asar

- test coverage!!
    + https://github.com/electron/spectron

- should image comparison be a component here? 
    + Or a hook in plotly.js after 'plotly-graph' convert.js?

- Maybe each component should spawn a browser window??
    + so that each dependencies don't conflict
    + might slow down app though?

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
    path: /* if none given, try to resolve ${name} */,
    route: /* default to same as name */,
    options: {
      pathToPlotlyJS: ''
    },
  }],
  port: 9090
})

server.on('after-export', (result) => {
  // log something    
})
```

### Nomenclature

- request (or caller) to renderer (evt: ${component.name} sendToRenderer)
- renderer to converter (evt: ${uid} sendToMain)
- converter to request (or caller, reply)

```
comp[/* parse, render, convert */] = (info, opts, cb) => {}

// with
cb = (errorCode, result) => {}
```

Should we add an option about which keys are included in event data?
