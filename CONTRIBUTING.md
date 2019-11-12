# Contributing to Orca

Note that this section targets contributors. If you're interested in using Orca
see the [installation instructions](https://github.com/plotly/orca#installation).

## Dev Installation

### Prerequisites

- git
- [Node.js](https://nodejs.org/en/). We recommend using Node.js v8.x, but all
  versions starting from v6 should work.  Upgrading and managing node versions
  can be easily done using [`nvm`](https://github.com/creationix/nvm) or its
  Windows alternatives.
- [`npm`](https://www.npmjs.com/) v5.x and up (which ships by default with
  Node.js v8.x) to ensure that the
  [`package-lock.json`](https://docs.npmjs.com/files/package-lock.json) file is
  used and updated correctly.

### Clone the plotly.js repo

```bash
git clone https://github.com/plotly/orca.git
cd orca
```

### Install Node.js dependencies

```
npm install
```

### Install poppler

We haven't found a Node.js library that converts PDF files to EPS,
so we use [poppler](https://poppler.freedesktop.org/). Orca also support EMF
exports when [`inkscape`](https://inkscape.org/) is found in the environment. So
to run the tests, you'll need to:


On Debian-flavored Linux:

```
apt-get poppler-utils inkscape
```

On OS X:

```
brew install poppler inkscape
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

To check test coverage:

```
npm run coverage
```

### Running image tests

#### Build Docker image
To produce images reproducibly,
we need to make sure Orca is running in exactly the same environment.
To achieve this, we package Orca in a Docker image which can be built with:
```
export DOCKER_ORCA_IMAGE=orca_dev
docker build -t "$DOCKER_ORCA_IMAGE" -f deployment/Dockerfile .
```

#### Build images and compare

To run the image tests, run the following:
```
./test/image/render_mocks_cli build/test_images "$DOCKER_ORCA_IMAGE" && \
./test/image/compare_images test/image/baselines build/test_images build/test_images_diff
```

#### Generate new baselines
Simply build images as above but save then at `test/image/baselines` instead:
```
./test/image/render_mocks_cli test/image/baselines "$DOCKER_ORCA_IMAGE"
```
** Note that one can change the version of plotly.js used to build images
by editing `test/image/render_mocks_cli`. **

## Packaging

We use [`electron-builder`](https://github.com/electron-userland/electron-builder) to pack up
the `orca` executable. To do so locally, run:

```
npm run pack
```

the new executable will appear in the `release/` directory.

## Releases

At the moment, we manually upload the OS X, Windows, and Linux executables
(built on Travis, AppVeyor and CircleCI respectively) on the Github
[release](https://github.com/plotly/orca/releases). It would be nice to
automate this process somehow.

### Checklist

- Make sure tests are passing off `master` on [CircleCI](https://circleci.com/gh/plotly/workflows/orca/tree/master)
- Run `git checkout master && git pull`
- Update and commit the [CHANGELOG.md](https://github.com/plotly/plotly.js/blob/master/CHANGELOG.md)
  according to the [keepachangelog](http://keepachangelog.com/) specs. **Pro tip**:
  use the GitHub compare URLs `https://github.com/plotly/orca/compare/v<X.Y.Z>...master` replacing
  `<X.Y.Z>` with the most recent orca version.
- Run [`npm version {patch | minor | major}`](https://docs.npmjs.com/cli/version), which automatically
  + bumps the version in the orca package.json
  + `git commit`, with message `'X.Y.Z'`
  + [`git tag -a`](https://git-scm.com/book/en/v2/Git-Basics-Tagging), adding a tag `'vX.Y.Z'`
- Review version commit by e.g. `git show HEAD`
- Run `git push && git push --tags`
- Go to the [release section](https://github.com/plotly/orca/releases) and
  make a new release with title `vX.Y.Z` same as the git tag, then:
  + Copy the CHANGELOG items in the description field and add some extra info if you feel like it.
  + Grab the Linux build from CircleCI `electron-pack-and-release` job artifacts under the latest [master](https://circleci.com/gh/plotly/workflows/orca/tree/master) build -> Artifacts -> release.zip
  + Grab the Windows build from [AppVeyor](https://ci.appveyor.com/project/AppVeyorDashAdmin/image-exporter) under Latest Build -> Artifacts -> release.zip
  + Grab the Mac build automatically pushed to [Amazon S3](https://s3.console.aws.amazon.com/s3/buckets/image-exporter-travis-artifacts/plotly/orca/?region=us-east-1&tab=overview) from Travis.
    **N.B.** Select the latest build (largest number *note:* the folders are not necessarily sequential) -> release.zip
- Run `npm publish`
- Publish conda packages:
  + Download the following artifacts as above:
    - `conda-linux-64.zip` (CircleCI)
    - `conda-win-64.zip` (AppVeyor)
    - `conda-osx-64.zip` (Travis)
  + Unzip each artifact
    + `conda-linux-64.zip` becomes `linux-64/plotly-orca-*.tar.bz2`
    + `conda-win-64.zip` becomes `win-64/plotly-orca-*.tar.bz2`
    + `conda-osx-64.zip` becomes `osx-64/plotly-orca-*.tar.bz2`
  + From a conda environment with the `anaconda-client` package installed run `anaconda login`
  + Enter the credentials for the plotly anaconda channel
  + For each of the three `plotly-orca-*.tar.bz2` files listed above, run `anaconda upload /path/to/XX-64/plotly-orca-*.tar.bz2`
  + Run `anaconda logout`
- :beers:

## Overview

### Writing testable code for Electron Apps

Electron creates an executable environment. That is, `require('electron')`
does not do the same when executed as `node index.js` and `electron
index.js`.

So, to write good unit tests, it becomes important to split logic that only
runs in Electron from other things that can be run in Node.js. That's why in
`src/app/*`, only the `index.js` files require Electron modules. The other
modules are _pure_ Node.js and are tested in `test/unit/` using
[TAP](http://www.node-tap.org/). The Electron logic is itself tested using
[Spectron](https://github.com/electron/spectron) which is much slower and brittle.

### Anatomy of an Orca component

Along with a `name` field, each component has a `ping`, an `inject`, a `parse`,
a `render` and a `convert` method:

* `ping` (required, renderer process): method that send healthy signal from the
  renderer to main process
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
turn components into classes as this practice would be difficult to implement
correctly in the main and renderer process at once.

### Nomenclature for IPC callbacks

Orca is a heavy user of Electron's IPC (inter-process-communication)
which in turn is callback heavy. To help us stay out of _callback hell_, we use
the following terms to designates callbacks:

- At the end of the data-parse callback, we call the component module `parse`
  method as `parse(body, request, componentOpts, sendToRenderer)` where `sendToRenderer`
  is a callback.
- `sendToRenderer` transfers info from the main to the
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

Older Plotly devs might remember our old `nw.js` image server, but yeah
Electron is way better than `nw.js` and a lot more people are using it. Using
it for this project was a no-brainier.

Devs more experienced with `nw.js` should note: Electron apps juggle between a
Node.js process (called the **main** process) and browser scripts (call the
**renderer** process). Compared to `nw.js`, creating Electron apps requires a
little more boiler plate, but Electron makes it much easier to know what
globals you have available.

## Code style

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)
