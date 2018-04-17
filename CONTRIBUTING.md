# Contributing to @plotly/image-exporter

Note that this section targets contributors. If you're interested in using the
standalone app, [download the latest
release.](https://github.com/plotly/image-exporter/releases).

## Dev Installation

### Prerequisites

- git
- [Node.js](https://nodejs.org/en/). We recommend using Node.js v8.x, but all
  versions starting from v4 should work.  Upgrading and managing node versions
  can be easily done using [`nvm`](https://github.com/creationix/nvm) or its
  Windows alternatives.
- [`npm`](https://www.npmjs.com/) v5.x and up (which ships by default with
  Node.js v8.x) to ensure that the
  [`package-lock.json`](https://docs.npmjs.com/files/package-lock.json) file is
  used and updated correctly.

### Clone the plotly.js repo

```bash
git clone https://github.com/plotly/plotly.js.git
cd plotly.js
```

### Install Node.js dependencies

```
npm install
```

### Install poppler

We haven't found a Node.js library that converts PDF files to EPS,
so we use `poppler`:

On Debian-flavored Linux:

```
apt-get poppler-utils
```

On OS X:

```
brew install poppler
```

On Windows:

_Can anyone help us out?_


## Running tests

```
npm test

# or more granularly:

# just the standard linter
npm run test:lint

# just the unit tests (TAP tests using Node.js only)
npm run test:unit

# just the integration tests (using spectron)
npm run test:integration
```

## Packaging

We use (`electron-builder`](https://github.com/electron-userland/electron-builder) to pack up
the `plotly-graph-exporter` executable. To do so locally, run:

```
npm run pack
```

## Releases

_to do_

## Overview

### Writing testable code for Electron Apps

Electron creates an executable environment. That is, `require('electron')`
does not do the same when executed as `node index.js` and `electron
index.js`.

So, to write good unit tests, it becomes important to split logic that only
runs in Electron from other things that can be run in Node.js. That's why in
`src/app/*`, only `index.js` requires Electron modules. The other modules are
_pure_ Node.js and are tested in `test/unit/` using
[TAP](http://www.node-tap.org/). The Electron logic is itself tested using
[Spectron](https://github.com/electron/spectron) which is much slower.

### Anatomy of an image-exporter component

Along with a `name` field, each component has a `ping`, an `inject`, a `parse`,
a `render` and a `convert` method:

* `ping` (render process): method that send healthy signal renderer to main process
* `inject` (optional, main process): returns a string or an array of strings
  which is injected in the head of the app's HTML index file (e.g `<script
  src="plotly.js"></script>`)
* `parse` (required, main process): takes in a request body and coerces its
  options
* `render` (required, renderer process): takes options and returns image data
* `convert` (required, main process): converts image data to output head and
  body

Component modules are _just_ plain objects, listing methods. Components aren't
instantiated, their methods shouldn't depend on any `this`. We chose to not
turn components into classes as this practice would be difficult to implement in the
main and renderer process at once.

### Nomenclature for IPC callbacks

Image exporter is a heavy user of Electron's IPC (inter-process-communication)
which is in turn callback heavy. To help us stay out of _callback hell_, we use
the following terms to designates callbacks:

- At the end of the data-parse callback, we call the component module `parse`
  method as `parse(body, componentOpts, sendToRenderer)` where `sendToRenderer`
  is callback.
- `sendToRenderer` is the callback that transfers info from the main to the
  renderer process as `sendToRenderer(errorCode, parseInfo)`.
- In the renderer process we then call the component module `render` method as
  `render(info, componentOpts, sendToMain)` where `sendToMain` is a callback.
- `sendToMain` transfers info from the renderer back to main process as
  `sendToMain(errorCode, result)`
- Back in the main process, the component module `convert` method is then
  called as `convert(fullInfo, componentOpts, reply)` when `reply` is (you
  guessed it) a callback.
- `reply` is then called as `reply(errorCode, convertInfo)`.

### What happened to `nw.js`?

Older plotly devs might remember our old `nw.js` image server, but yeah
Electron is way better than `nw.js` a lot of people are using it. Using it for
this project was a no-brainier.

Devs more experienced with `nw.js` should note: Electron apps juggle between a
Node.js process (called the **main** process) and browser scripts (call the
**renderer** process). Compared to `nw.js`, creating Electron apps requires a
little more boiler plate, but Electron makes it much easier to know what
globals you have available.
