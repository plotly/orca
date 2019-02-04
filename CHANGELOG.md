# Orca changelog

For more context information, please read through the
[release notes](https://github.com/plotly/orca/releases).

To see all merged commits on the master branch that will be part of the next Orca release, go to:

https://github.com/plotly/orca/compare/vX.Y.Z...master

where X.Y.Z is the semver of most recent Orca release.


## [1.2.1] 2019-02-04

### Fixed

- Fix `scattermapbox` image generation when mapbox access token is set
  in the `layout.mapbox` container in plotly-graph component [#195]


## [1.2.0] 2019-01-24

### Added

- Add `--cors` CLI option for `orca serve` to enable Cross-Origin Resource Sharing (CORS) [#135]

- Add support for EMF exports for `plotly-graph` [#152]

### Changed

- Update dependencies `fast-isnumeric`, `file-type`, `glob`, `read-chunk` and `semver`[#177]

### Fixed

- Fix --output `orca graph` CLI option for path/to/filename [#176]

- Pass command line options to `plotly-dash-preview` [#191]


## [1.1.1] 2018-08-30

This release is associated with improved standalone installation instructions
in the repo README from #122.

### Fixed
- Mac OS installer fixups [#122]
  + Don't make any changes if `orca` is already on the `PATH`
  + Only copy `orca.sh` to `/usr/local/bin` if orca is installed as an application
  + Perform `orca.sh` copy with administrator privileges to avoid permission denied errors

## [1.1.0] 2018-08-14

Orca is now a `conda` package [#113]:

```
conda install -c plotly plotly-orca
```

### Added
- Add `--graph-only` CLI option for `orca serve` to only boot the `plotly-graph`
  component, saving memory [#114]
- Add `table` plotly graph traces to `--safeMode` handler [#98]

### Changed
- Use `request@2.88.0`

### Fixed
- Hide electron icon from OS X dock [#103]


## [1.0.0] 2018-05-17

First Orca release :tada:

See installation instructions
[here](https://github.com/plotly/orca#installation). This release ships with
Orca CLI command `graph` (for plotly.js graph exports) and `serve` (which boots
up a server similar to Plotly's Image Server). Run `orca graph --help` and `orce
serve --help` for more info.
