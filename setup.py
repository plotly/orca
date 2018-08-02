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

setup(version=package_json['version'])
