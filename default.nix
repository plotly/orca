with (import (builtins.fetchTarball {
  # Descriptive name to make the store path easier to identify
  name = "nixos-19.03-2019-07-25";
  url = https://github.com/nixos/nixpkgs/archive/96151a48dd6662fb3f84bd16bbfe8a34f59d717a.tar.gz;
  # Hash obtained using `nix-prefetch-url --unpack <url>`
  sha256 = "06cqc37yj23g3jbwvlf9704bl5dg8vrzqvs5y2q18ayg9sw61i6z";

  # Descriptive name to make the store path easier to identify
  #name = "nixos-master-2019-07-25";
  #url = https://github.com/nixos/nixpkgs/archive/fd2b2b5cd56a5be788fa88dcd9605a3a5bb5ecc7.tar.gz;
  # Hash obtained using `nix-prefetch-url --unpack <url>`
  #sha256 = "0jgy1dplp007la5waknrijzxh6ql88lbigyr7q8n9m7n92x736l9";
  # sha256 = "0000000000000000000000000000000000000000000000000000";
}) {});
let
  orca = import ./nix/default.nix {};
in
stdenv.mkDerivation {
  name = "orca";
  meta = {
    homepage = https://github.com/plotly/orca;
    description = "Command line application for generating static images of interactive plotly charts";

    license = stdenv.lib.licenses.mit;
    platforms = stdenv.lib.platforms.linux;
  };
  version = "0.1";
  unpackPhase = "true";
  propagatedBuildInputs = [orca.package electron poppler_utils inkscape];

  installPhase = ''
    mkdir $out
    cat > $out/orca << EOF
#!/bin/bash
export LIBGL_ALWAYS_SOFTWARE=true
export GALLIUM_DRIVER=softpipe
export FREETYPE_PROPERTIES="truetype:interpreter-version=35 cff:no-stem-darkening=1 autofitter:warping=1"
ELECTRON_PATH=${electron}/bin/electron ${orca.package}/bin/orca "\$@"
EOF
    chmod +x $out/orca
  '';

}
