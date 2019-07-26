{ nixpkgs ? <nixpkgs>, system ? builtins.currentSystem }:

with (import nixpkgs { inherit system; });

(import ((fetchFromGitHub {
  owner = "svanderburg";
  repo = "node2nix";
  rev = "2d0061fe3778e057d1c9c8266b130c8ccb98aad6";
  sha256 = "1x1ksflcd7r0n758whmsy7rjbas3w3jh5c9lv9ngb44lpn1lq8wg";
})) {}).package
