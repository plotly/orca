# Plotly Image Exporter

[![CircleCI](https://circleci.com/gh/plotly/image-exporter.svg?style=svg)](https://circleci.com/gh/plotly/image-exporter)

This repo contains source code for:

- `plotly-graph-exporter` standalone app,
- `plotly-image-exporter` npm package, and
- Plotly's image server

## `plotly-graph-exporter` standalone app

### Install

To start using the `plotly-graph-exporter` standalone app, simply download the
binaries corresponding to your operating system from the
[release](https://github.com/plotly/image-exporter/releases) page.

### Usage

From the command line:

```
$ plotly-graph-exporter '{ "data": ["y": [1,2,3]] }' -o fig.png
```

generates a PNG from the inputted plotly.js JSON attributes. To print info
about the supported arguments:

```
$ plotly-graph-exporter --help
```

From a Python script:

```python
from subprocess import call
import json

fig = {"data": [{"y": [1,2,1]}]}
call(['plotly-graph-exporter', json.dumps(fig)])
```

From an R script:

```R
library(plotly)
p <- plot_ly(x = 1:10, y = 1:10, color = 1:10)
b <- plotly_build(p)$x[c("data", "layout")]
json <- plotly:::to_JSON(b)
cmd <- sprintf("plotly-graph-exporter '%s' -o r-export-test.png", json)
system(cmd)
```

## `plotly-image-exporter` npm package

### Install

With Node.js (v6.x or v8.x) and npm installed:

```
$ npm install -g electron plotly-image-exporter
```

which installs two executables `plotly-graph-exporter` and `plotly-export-server`

### CLI Usage

The `plotly-graph-exporter` executable works the same as the
`plotly-graph-exporter` standalone app except that it uses the Node.js and
Electron versions that are installed locally. For example,

```
$ plotly-graph-exporter https://plot.ly/~empet/14324.json --format svg
```

generates an SVG from a plotly.js JSON hosted on [plot.ly](https://plot.ly/).

In turn, the `plotly-export-server`executable work similarly to plotly's own
image server where not only plotly.js graphs can be exported, but also plotly
dashboards, thumbnails and dash reports (see full list
[here](https://github.com/plotly/image-exporter/tree/master/src/component)).

Boot up the server with:

```
$ plotly-export-server --port 9090 &
```

then make POST requests as:

```
$ curl localhost:9090/plotly-graph/ <payload>
$ curl localhost:9090/plotly-dashboard/ <payload>
```

### API Usage

Using the `plotly-image-exporter` module allows developers to build their own
plotly exporting tool. We export two Electron app creator methods `run` and
`server`.  Both methods return an Electron `app` object (which is an event
listener/emitter).

To create a _runner_ app:

```js
// main.js

var plotlyExporter = require('plotly-exporter')

var app = plotlyExporter.run({
  component: 'plotly-graph',
  input: 'path-to-file' || 'glob*' || url || '{data: [], layout: {}}' || [/* array of those */],
  debug: true
})

app.on('after-export', (info) => {
  fs.writeFile('output.png', info.body, (err) => console.warn(err))
})

// other available events:
app.on('after-export-all', () => {})
app.on('export-error', () => {})
app.on('renderer-error', () => {})
```

then launch it with `electron main.js`

Or to create a _server_ app:

```js
// main.js

var plotlyExporter = require('plotly-exporter')

var app = plotlyExporter.serve({
  port: 9090,
  component: 'component name ' || [{
    name: 'plotly-graph',
    path: /* path to module if none given, tries to resolve ${name} */,
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

// other available events:
app.on('after-connect', () => {})
app.on('export-error', () => {})
app.on('renderer-error', () => {})
```

then launch it with `electron main.js`

## Plotly's image server

Plotly's image server is dockerized and deployed here. See the `deployment/`
[README](https://github.com/plotly/image-exporter/tree/master/deployment) for more info.

## System dependencies

**If you don't care about exporting EPS you can skip this section.**

The environment you're installing this into may require Poppler for EPS exports.

#### Poppler Installation via Aptitude (used by some \*nix/BSD, e.g. Ubuntu)

```
$ apt-get poppler-utils (requires `sudo` or root privileges)
```

#### Poppler Installation via Homebrew (third-party package manager for Mac OS X)

```
$ brew install poppler
```

## Contributing

See
[CONTRIBUTING.md](https://github.com/plotly/image-exporter/blob/master/CONTRIBUTING.md).
You can also [contact us](https://plot.ly/products/consulting-and-oem/) if you
would like a specific feature added.

## License

Code released under the MIT ©
[License](https://github.com/plotly/image-exporter/blob/master/LICENSE).
