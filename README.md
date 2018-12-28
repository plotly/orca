# Orca

![orca logo](orca_logo.png)

[![npm version](https://badge.fury.io/js/orca.svg)](https://badge.fury.io/js/orca)
[![MIT License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://github.com/plotly/orca/blob/master/LICENSE)

Orca is an Electron app that generates images and reports of Plotly things like
plotly.js graphs, dash apps, dashboards from the command line. Additionally,
Orca is the backbone of Plotly's Image Server. Orca is also an acronym for
**Open-source Report Creator App.**

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

- Unzip the `mac-release.zip` file.
- Double-click on the `orca-X.Y.Z.dmg` file. This will open an installation window.
- Drag the orca icon into the `Applications` folder.
- Open finder and navigate to the `Applications/` folder.
- Right-click on the orca icon and select _Open_ from the context menu.
- A password dialog will appear asking for permission to add orca to your system `PATH`.
- Enter you password and click _OK_.
- This should open an _Installation Succeeded_ window.
- Open a new terminal and verify that the orca executable is available on your `PATH`.

```
$ which orca
/usr/local/bin/orca

$ orca --help
Plotly's image-exporting utilities

  Usage: orca [--version] [--help] <command> [<args>]
  ...
```

#### Windows

- Extract the `windows-release.zip` file.
- In the `release` folder, double-click on `orca Setup X.Y.Z`, this will create an orca icon on your Desktop.
- Right-click on the orca icon and select _Properties_ from the context menu.
- From the _Shortcut_ tab, copy the directory in the _Start in_ field.
- Add this _Start in_ directory to you system `PATH` (see below).
- Open a new Command Prompt and verify that the orca executable is available on your `PATH`.

```
> orca --help
Plotly's image-exporting utilities

  Usage: orca [--version] [--help] <command> [<args>]
  ...
```

##### Windows References
 - How to set the path and environment variables in Windows: https://www.computerhope.com/issues/ch000549.htm

#### Linux

- Make the orca AppImage executable.

```
$ chmod +x orca-X.Y.Z-x86_64.AppImage
```

- Create a symbolic link named `orca` somewhere on your `PATH` that points
to the AppImage.

```
$ ln -s /path/to/orca-X.Y.Z-x86_64.AppImage /somewhere/on/PATH/orca
```

- Open a new terminal and verify that the orca executable is available on your `PATH`.

```
$ which orca
/somewhere/on/PATH/orca

$ orca --help
Plotly's image-exporting utilities

  Usage: orca [--version] [--help] <command> [<args>]
  ...
```

##### Linux Troubleshooting: Cannot open shared object
The Electron runtime depends a several common system libraries. These
libraries are pre-installed in most desktop Linux distributions
(e.g. Ubuntu), but are not pre-installed on some server Linux distributions
(e.g. Ubuntu Server). If a shared library is missing, you will see an error
message like:

```
$ orca --help
orca: error while loading shared libraries: libgtk-x11-2.0.so.0:
cannot open shared object file: No such file or directory
```

These additional dependencies can be satisfied by installing:
 - The `libgtk2.0-0` and `libgconf-2-4` packages from your distribution's
 software repository.
 - The `google-chrome-stable` package from the [Google Linux Software
 Repository](https://www.google.com/linuxrepositories/).

##### Linux Troubleshooting: Headless server configuration
The Electron runtime requires the presence of an active X11 display server,
but many server Linux distributions (e.g. Ubuntu Server) do not include X11
by default.  If you do not wish to install X11 on your server, you may
install and run orca with Xvfb instead.

On Ubuntu Server, you can install Xvfb like this:
```
$ sudo apt-get install xvfb
```

To run orca under Xvfb, replace the symbolic link suggested above with a shell
script that runs the orca AppImage executable using the `xvfb-run` command.

```
#!/bin/bash
xvfb-run -a /path/to/orca-X.Y.Z-x86_64.AppImage "$@"
```

Name this shell script `orca` and place it somewhere or your system `PATH`.

##### Linux References
 - How to add directory to system path in Linux: https://www.computerhope.com/issues/ch001647.htm
 - AppImage: https://appimage.org/
 - Xvfb: https://en.wikipedia.org/wiki/Xvfb

## Quick start

From the command line:
Unix/MacOS:

```
$ orca graph '{ "data": [{"y": [1,2,1]}] }' -o fig.png
```
Windows:

```
orca graph "{ \"data\": [{\"y\": [1,2,1]}] }" -o fig.png
```
generates a PNG from the inputted plotly.js JSON attributes. Or,

```
$ orca graph https://plot.ly/~empet/14324.json --format svg
```

generates an SVG from a plotly.js JSON hosted on [plot.ly](https://plot.ly/).

When running 

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
orca(p, "plot.svg")
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

**If you don't care about exporting EPS or EMF you can skip this section.**

The environment you're installing this into may require Poppler for EPS exports and Inkscape for EMF exports.

#### Poppler installation via Aptitude (used by some \*nix/BSD, e.g. Ubuntu)

```
$ apt-get install poppler-utils (requires `sudo` or root privileges)
```

#### Poppler installation via Homebrew (third-party package manager for Mac OS X)

```
$ brew install poppler
```

#### Inkscape installation via Aptitude (used by some \*nix/BSD, e.g. Ubuntu)

```
$ apt-get install inkscape (requires `sudo` or root privileges)
```

#### Inkscape installation via Homebrew (third-party package manager for Mac OS X)

```
$ brew install inkscape
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
