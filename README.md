# image-exporter

aka image server 2.0.

See https://github.com/plotly/streambed/issues/9655 for info on the requirements.

## Install

- `npm i`
- install `poppler`:
    - Linux: `apt-get poppler-utils`
    - OS X: `brew install poppler`
- `npm run test`

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

Electron creates an executable environment. That is, `require('electron')` does
not do the same when executed as `node index.js` and `electron index.js`. So, to
write good unit tests, it becomes important to split logic that only runs in
electron from other things that can be run in node. That's why in `src/app/*`,
only `index.js` requires electron modules. The other modules are _pure_
node.js and are tested in `test/unit/` using [TAP](http://www.node-tap.org/).
The electron logic is itself tested using
[spectron](https://github.com/electron/spectron) which is much slower.

### Components

This project has a larger scope than the current image server.

We want to export not just plotly `"data"/"layout"`, but dashboard print and
thumbnail views.  Eventually, we could even export plotly animations to gifs.
Moreover, we probably want some export types to be open-source while others
streambed-only. Therefore, this package defines a _component_ framework. See
`src/component/` for two examples.

Each component has an `inject`, a `parse`, a `render` and a `convert` method:

- `inject` (optional, main process) returns a string or an array of strings
  which is injected in the head of the app's HTML index file
  (e.g `<script src="plotly.js"></script>`)
- `parse` (required, main process) takes in a request body and coerces its options.
- `render` (required, renderer process) takes options and returns image data
- `convert` (required, main process) converts image data to output head and body

Component modules are _just_ plain objects, listing methods. Components aren't
instantiated, their methods shouldn't depend on any `this`.

### Logging

I propose that this package won't assume anything logging related. Logging will
be achieved by listening to `app` events and piping their info into a
user-chosen logger package (e.g. `bunyan` for the streambed image server).

## API

We export two electron app creator methods: `run`, `serve`. Both methods return
an electron `app` object (which is an event listener/emitter).

### `run`

Creates a _runner_ app (code in `src/app/runner/`):

```js
// main.js

var plotlyExporter = require('plotly-exporter')

var app = plotlyExporter.run({
  component: 'component name' || {/* component options, see `serve` below */},
  input: 'path-to-file' || 'glob*' || url || '{data: [], layout: {}}' || [/* array of those */],
  debug: false || true
})

app.on('after-export', (info) => {
  fs.writeFile('output.png', info.body, (err) => console.warn(err))
})

app.on('after-export-all', () => {})
app.on('export-error', () => {})
app.on('renderer-error', () => {})
```

and launch it with `electron main.js`.

### `serve`

Creates a _server_ app (code in `src/app/server/`):

```js
// main.js

var plotlyExporter = require('plotly-exporter')

var app = plotlyExporter.serve({
  port: 9090,
  component: 'component name ' || [{
    name: 'plotly-graph',
    path: /* path to module if none given, try to resolve ${name} */,
    route: /* default to same as ${name} */,

    // other options passed to component methods
    options: {
      plotlyJS: '',
      mathjax: '',
      topojson: '',
      mapboxAccessToken: ''
    }
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

and launch it with `electron main.js`.

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
+ https://github.com/pixijs/pixi.js/issues/2233
+ https://github.com/pixijs/pixi.js/pull/2481/files

## Nomenclature

- request (or caller) to renderer (`evt: ${component.name}` sendToRenderer)
- renderer to converter (`evt: ${uid}` sendToMain)
- converter to request (or caller, reply)

```js
comp.inject = function (opts) { }

comp[/* parse, render, convert */] = function (info, opts, cb) { }

// with
opts // => component options container
cb = (errorCode, result) => {}
```
