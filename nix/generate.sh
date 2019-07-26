#!/bin/sh -e
rm -f default.nix node-packages.nix node-env.nix
nix run -f ./node2nix.nix -c node2nix \
  --nodejs-10 \
  --input ../package.json \
  --lock ../package-lock.json
