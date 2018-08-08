from distutils.core import setup
import json

# Rational
# --------
# This file only exists to help give conda-build access to the version in our
# package.json file. conda-build has built-in support for loading meta-data
# from setup.py through the load_setup_py_data() function. See
# https://conda.io/docs/user-guide/tasks/build-packages/define-metadata.html#

with open('package.json') as f:
    package_json=json.load(f)

# Convert NPM-compatible semantic version (e.g. "1.0.1-rc.1")
# to setup tools compatible version string (e.g. "1.0.1rc1")
npm_version = package_json['version']
ver_split = npm_version.split('-')
py_version = ver_split[0] + ''.join(ver_split[1:]).replace('.', '')

setup(version=py_version)
