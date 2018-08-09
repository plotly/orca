Building the conda package
==========================
This directory contains the configuration files that are needed to build
orca into a standalone conda package.

To build the conda package, first install
[Anaconda](https://www.anaconda.com/download/#macos) or
[Miniconda](https://conda.io/miniconda.html). 

Next, use `conda` to install the `conda-build` package:

```bash
$ conda install conda-build
```

Finally, build the package from the root project directory:

```bash
$ conda build recipe/
```

The resulting package will be named `plotly-orca-*.tar.bz2`, and the build
command will display the full path of the output location. 

How it works
------------
Here's a quick tour of the build configuration. For more information see the 
official conda docs for 
[building packags](https://conda.io/docs/user-guide/tasks/build-packages/define-metadata.html).

### `meta.yaml` ###
The `meta.yaml` file in this directory is the top-level configuration file for
the conda package. Here we specify the package name (`package.name`) and
version (`package.version`, more on the version logic below), along with the
relative path to the orca source directory (`source.path`).

The build number (`build.number`) parameter should always start at 1 for
each new version of orca. It should be incremented if it becomes necessary to
publish multiple conda builds that correspond to the same orca version.

By default, conda-build does a lot of work to
[make binary packages relocatable](https://conda.io/docs/user-guide/tasks/build-packages/make-relocatable.html).
On Linux, this logic results in a gconf settings warning being raised each
time orca is used, and it doens't seem to be necessary, so it has been
disabled by setting the `build.binary_relocation` property to `False`.  

Finally, the `requirements.build` section is used to specify that we need
`nodejs` available during the package build process (but not at runtime).

## `build.sh` and `bld.bat`
The `build.sh` and `bld.bat` files are scripts with special names that are
recognized by conda-build.  On Linux and OS X the `build.sh` script will be
executed in a fresh conda environment that contains only the packages
specified in the `requirements.build` section of `meta.yaml`
(just `nodejs` in our case).  Likewise, on Windows the `bld.bat` script is
executed under the same conditions.

These build scripts all start off by running `npm install` and `npm run pack`
to create the electron build of orca in the `release/` directory.

Then, for each OS, the directory of extracted build files is moved to a
directory under the root of the environment
(conda populates the `PREFIX` environment variable with this location).

Finally, an entry-point script named `orca` (`orca.cmd` on Windows) is placed
somewhere in the environment that will end up on the user's `PATH`
(`$PREFIX/bin` for Linux and OS X, and just `$PREFIX` for Windows).  This
script is responsible for passing command line arguments through to the `orca`
executable that lives somewhere inside the directory of build files that was
moved in the previous step.

## Package version and `load_setup_py_data()`
The canonical version string for `orca` resides in `package.json`.  In order to
avoid having a separate copy of this string in `meta.yaml` we use the following
approach:

conda build provides a built-in function called `load_setup_py_data` that can
be used inside a `jinja2` template expression in `meta.yaml` to load all of
the metadata associated with the project's `setup.py` file. Orca is not a
Python library, but it order to take advantage of this function,
a `setup.py` script has been added to the root project directory. The
`setup.py` script is responsible for dynamically loading the version string
from the `package.json` file.  