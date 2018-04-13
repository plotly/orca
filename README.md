# Plotly Image Exporter

## Install

### Dependencies

The environment you're installing this into may require Poppler.

#### Poppler Installation via Aptitude (used by some \*nix/BSD, e.g. Ubuntu)

`apt-get poppler-utils` (requires `sudo` or root privileges)

#### Poppler Installation via Homebrew (third-party package manager for Mac OS X)

`brew install poppler`

## In Brief

This image exporter is not a completely new tool. Rather, it is comprised of much preexisting functionality which has been organized and isolated into a single canonical repository. Plotly Cloud, plotly.js and eventually the R, Python and Julia libraries will require it and optionally configure it for their needs.

This Image Exporter suite consists broadly of two commandline tools:
* The "image server," which renders graphs as specified by commandline arguments
* The "image runner," which renders graphs as specified by files in the local filesystem

The image runner makes the suite easier to use for plotly.js testing and the R, Python and Julia libraries.

### Electron

Electron apps juggle between a node.js process (called the **main** process) and browser scripts (call the **renderer** process). Compared to `nw.js`, creating Electron apps requires a little more boiler plate, but Electron makes it much easier to know what globals you have available.

Electron creates an executable environment. That is, `require('electron')` does not do the same when executed as `node index.js` and `electron index.js`. So, to write good unit tests, it becomes important to split logic that only runs in Electron from other things that can be run in Node.js. That's why in `src/app/*`, only `index.js` requires Electron modules. The other modules are _pure_ Node.js and are tested in `test/unit/` using [TAP](http://www.node-tap.org/). The Electron logic is itself tested using [Spectron](https://github.com/electron/spectron) which is much slower.

### Components

This project has a larger scope than the current image server.

We want to export not just Plotly `"data"/"layout"`, but dashboard, print and thumbnail views.  Eventually, we could even export Plotly animations to gifs. Moreover, we probably want some export types to be open-source while others Plotly Cloud-only. Therefore, this package defines a _component_ framework. See `src/component/` for two examples.

Each component has an `inject`, a `parse`, a `render` and a `convert` method:
* `inject` (optional, main process) returns a string or an array of strings which is injected in the head of the app's HTML index file (e.g `<script src="plotly.js"></script>`)
* `parse` (required, main process) takes in a request body and coerces its options
* `render` (required, renderer process) takes options and returns image data
* `convert` (required, main process) converts image data to output head and body

Component modules are _just_ plain objects, listing methods. Components aren't instantiated, their methods shouldn't depend on any `this`.

### Logging

Logging can be achieved by listening to `app` events and piping their info into a user-chosen logger package (e.g. `bunyan` for the Plotly Cloud image server).

## API

We export two Electron app creator methods: `run`, `serve`. Both methods return an Electron `app` object (which is an event listener/emitter).

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

…which can be launched by `electron main.js`.

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

…which can be launched with `electron main.js`.

## CLI

See `./bin/`.

### Graph Exporter

A specialized "runner" for Plotly graphs:

```sh
plotly-graph-exporter 20.json https://plot.ly/~empet/14324.json --format svg
```

…where `20.json` is a local `"data"/"layout"` JSON file and `https://plot.ly/~empet/14324` is the URL of a remote JSON resource.

#### Python Usage Example

```python
from subprocess import call
import json

fig = {"data": [{"y": [1,2,1]}]}
call(['plotly-graph-exporter', json.dumps(fig)])
```

#### R Usage Example

```R
library(plotly)
system2("plotly-graph-exporter", plotly_json(fig, FALSE))
```

### Export Server

The Export Server is very similar to the current image server but with support for multiple components:

`plotly-image-server --port 9090`

Dispatch to one component based on the URL of the request:

`curl localhost:9090/plotly-graph/ <payload>`

…or e.g.:

`curl localhost:9090/plotly-dashboard/ <payload>`

### Pixel Comparisons

This is similar to the current plotly.js pixel comparison runner, but as a standalone version that our R, Python, and Julia libraries could also use for testing purposes.

## Other Useful Links

Debugging:

* https://github.com/electron/devtron
* https://electron.atom.io/docs/api/app/#event-gpu-process-crashed

Performance:

* https://github.com/electron/asar
* https://github.com/pixijs/pixi.js/issues/2233
* https://github.com/pixijs/pixi.js/pull/2481/files

## Nomenclature

* Request (or caller) to renderer (`evt: ${component.name}` `sendToRenderer`)
* Renderer to converter (`evt: ${uid}` `sendToMain`)
* Converter to request (or caller, reply)
```js
comp.inject = function (opts) { }

comp[/* parse, render, convert */] = function (info, opts, cb) { }
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;…with:
```js
opts // => component options container
cb = (errorCode, result) => {}
```
