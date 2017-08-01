# image-exporter

aka image server 2.0.

See https://github.com/plotly/streambed/issues/9655 for info on the requirements.

## In brief

The new image exporter will be in a repo of its own. Streambed, plotly.js and
eventually the R, Python and Julia libraries will require it and optionally
configure it for their needs.

Note that I don't want to call this project _image server 2.0_ because I also
want to expose an image _runner_ that reads files from the file system instead
of handling HTTP requests - which will make it easier to use for plotly.js
testing and the R, Python and Julia libraries.

### Electron

It's way better than `nw.js`, a lot of people are using it. Using it for this
project is a no-brainier.

Electron apps juggle between a node.js process (called the **main** process) and
browser scripts (call the **renderer** process). Compared to `nw.js`, creating
electron apps requires a little more boiler plate, but electron makes it much
easier to know what globals you have available.

### Components

This project has a larger scope than the current image server.

We want to export not just plotly `"data"/"layout"`, but dashboard print and
thumbnail views.  Eventually, we could even export plotly animations to gifs.
Moreover, we probably want some export types to be open-source while others
streambed only. Therefore, this package defines a _component_ framework. See
`src/component/` for two examples.

Each component has an `inject`, a `parse`, a `render` and a `convert` method:

- `inject` (main process) returns a string which is injected in the head of the
  app's HTML index file (e.g `<script src="plotly.js">`)
- `parse` (main process) takes in a request body and coerces its options.
- `render` (renderer process) takes options and return image data
- `convert` (main process) converts image data to output head and body

### Logging

I propose that this package won't assume anything logging related. Logging will
be achieved by listening to `app` events and piping their info into a
user-chosen logger package (e.g. `bunyan` for the streambed image server).

## API

We export two electron app creator methods: `run`, `serve`. Both methods return
an electron `app` object (which is an event listener/emitter).

### `run`

Creates a _runner_ app (code in `src/run.js`):

```js
var plotlyExporter = require('plotly-exporter')

var app = plotlyExporter.run({
  component: 'component name' || {/* component options, see `serve` below */},
  input: 'path-to-file' || 'glob*' || url || '{data: [], layout: {}}' || [/* array of those */],
  debug: false || true
})

app.on('after-export', (info) => {
  fs.writeFile('output.png', info.body, (err) => console.warn(err))
})

app.on('done', () => {})
app.on('export-error', () => {})
app.on('renderer-error', () => {})
```

### `serve`

Creates a _server_ app (code in `src/serve.js`):

```js
var plotlyExporter = require('plotly-exporter')

var app = plotlyExporter.serve({
  port: 9090,
  component: 'component name ' || [{
    name: 'plotly-graph',
    path: /* path to module if none given, try to resolve ${name} */,
    route: /* default to same as ${name} */,

    // options passed to component methods
    options: {
      pathToPlotlyJS: '',
      MathJax: '',
      localTopojson: '',
      mapboxAccessToken: ''
    },
  }, {
    // other component
  }, {
    // other component ...
  }],

  debug: false || true
})

app.on('after-export', (info) => {
  console.log(info)
})

app.on('after-connect', () => {})
app.on('export-error', () => {})
app.on('renderer-error', () => {})
```

## CLI

See `./bin/`.

### Graph exporter

A specialised `runner` for plotly graphs:

```
plotly-graph-exporter 20.json https://plot.ly/~empet/14324.json --format svg
```

where `20.json` is a local `"data"/"layout"` JSON file and
`https://plot.ly/~empet/14324` is a JSON URL.

I'm thinking the R, Python and Julia libraries could simply call
`plotly-graph-exporter` to offer offline image generation to their users.

### Export server

Export server very similar to the current image server but with support
for multiple components:

```
plotly-image-server --port 9090

# Dispatch to one component based on url of request
curl localhost:9090/plotly-graph/ <payload>

# or e.g.
curl localhost:9090/plotly-dashboard/ <payload>
```

### Pixel comparisons

Similar to the current plotly.js pixel comparison runner, but as a standalone
version that our R, Python, Julia libraries could use too for testing purposes.

## Other useful links

Debugging:

+ https://github.com/electron/devtron
+ https://electron.atom.io/docs/api/app/#event-gpu-process-crashed

Perf:

+ https://github.com/electron/asar

Test:

+ https://github.com/electron/spectron

## Nomenclature

- request (or caller) to renderer (`evt: ${component.name}` sendToRenderer)
- renderer to converter (`evt: ${uid}` sendToMain)
- converter to request (or caller, reply)

```
comp.inject = (opts) => {}
comp[/* parse, render, convert */] = (info, opts, cb) => {}

// with
cb = (errorCode, result) => {}

// where `opts` is the component's `options` container passed via the API.
```
