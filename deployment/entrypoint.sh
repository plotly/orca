#!/usr/bin/env bash

if [[ $1 == "--help" || $1 == "--version" || $1 == "graph" ]]; then
    xvfb-run --server-args "-screen 0 640x480x24" -a /var/www/image-exporter/bin/orca.js "$@"
elif [[ $1 == "serve" ]]; then
    shift 1 # Remove argument "serve" since it is assumed in the following
    /run_server "$@"
else # By default, run the server
    /run_server "$@"
fi
