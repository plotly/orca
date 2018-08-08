# Orca

[![npm version](https://badge.fury.io/js/orca.svg)](https://badge.fury.io/js/orca)
[![MIT License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://github.com/plotly/orca/blob/master/LICENSE)

Orca is an Electron app that generates images and reports of Plotly things like
plotly.js graphs, dash apps, dashboards from the command line. Additionally,
Orca is the backbone of Plotly's Image Server. Orca is also an acronym for
Open-source Report Creator App.

Visit [plot.ly](https://plot.ly) to learn more or visit the [Plotly forum](https://community.plot.ly/).

Follow [@plotlygraphs](https://twitter.com/plotlygraphs) on Twitter for Orca announcements.

## Installation

### Method 1: conda
If you have conda installed, you can easily install Orca from the plotly
conda channel using:
```
$ conda install -c plotly plotly-orca
```

which makes the `orca` executable available on the path of current conda
environment.

### Method 2: npm
If you have Node.js installed (recommended v8.x), you can easily install Orca
using npm as:

```
$ npm install -g electron@1.8.4 orca
```

which makes the `orca` executable available in your path.

### Method 3: Standalone binaries 

Alternatively, you can download the standalone Orca binaries corresponding to
your operating system from the
[release](https://github.com/plotly/orca/releases) page. Then, on

#### Mac OS

- Unzip `mac-release.zip` from your `Downloads/` folder
- Double-click on `orca-X.Y.Z.dmg` file, that should open an installation window
- Drag the orca icon into _Applications_
- In finder, go to the `Applications/` folder
- Right-click on the orca icon and click on _Open_, this should open an _Installation Succeeded_ window
- Open the terminal and start using Orca!

#### Windows

- Extract the `window-release.zip` file
- In the `release` folder, double-click on `orca Setup X.Y.Z`, this will create an orca icon on your Desktop
- Right-click on the orca icon, then click on _Properties_ and copy the _Starts in_ field
- In the command prompt, run `PATH %PATH%;<paste the "Starts in" field here>`

#### Linux

- Run `$ chmod +x orca-X.Y.Z-x86_64.AppImage`
- Add it to your `$PATH`

## Quick start

From the command line:

```
$ orca graph '{ "data": [{"y": [1,2,1]}] }' -o fig.png
```

generates a PNG from the inputted plotly.js JSON attributes. Or,

```
$ orca graph https://plot.ly/~empet/14324.json --format svg
```

generates an SVG from a plotly.js JSON hosted on [plot.ly](https://plot.ly/).

To print info about the supported arguments, run:

```
$ orca --help
$ orca <command> --help
```

To call `orca` from a Python script:

```python
from subprocess import call
import json
import plotly

fig = {"data": [{"y": [1,2,1]}]}
call(['orca', 'graph', json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)])
```

To call `orca` from an R script:

```R
library(plotly)

p <- plot_ly(x = 1:10, y = 1:10, color = 1:10)
b <- plotly_build(p)$x[c("data", "layout")]
json <- plotly:::to_JSON(b)

cmd <- sprintf("orca graph '%s' -o r-export-test.png", json)
system(cmd)
```

## API usage

Using the `orca` npm module allows developers to build their own
Plotly exporting tool. We export two Electron app creator methods `run` and
`serve`.  Both methods return an Electron `app` object (which is an event
listener/emitter).

To create a _runner_ app:

```js
// main.js

const orca = require('orca/src')

const app = orca.run({
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

Or, to create a _server_ app:

```js
// main.js

const orca = require('orca/src')

const app = orca.serve({
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
[README](https://github.com/plotly/orca/tree/master/deployment) for more info.

## System dependencies

**If you don't care about exporting EPS you can skip this section.**

The environment you're installing this into may require Poppler for EPS exports.

#### Poppler installation via Aptitude (used by some \*nix/BSD, e.g. Ubuntu)

```
$ apt-get poppler-utils (requires `sudo` or root privileges)
```

#### Poppler installation via Homebrew (third-party package manager for Mac OS X)

```
$ brew install poppler
```

## Contributing

See
[CONTRIBUTING.md](https://github.com/plotly/orca/blob/master/CONTRIBUTING.md).
You can also [contact us](https://plot.ly/products/consulting-and-oem/) if you
would like a specific feature added.

| Tests and Linux builds | Mac OS build | Windows build |
| ---------------------- | ------------ | ------------- |
| [![CircleCI](https://circleci.com/gh/plotly/orca.svg?style=svg)](https://circleci.com/gh/plotly/orca) | [![Build Status](https://travis-ci.org/plotly/orca.svg?branch=master)](https://travis-ci.org/plotly/orca) | [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/plotly/orca?svg=true)](https://ci.appveyor.com/project/AppVeyorDashAdmin/image-exporter) |


## License

Code released under the MIT ©
[License](https://github.com/plotly/orca/blob/master/LICENSE).
