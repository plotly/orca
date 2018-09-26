# !/bin/sh

# assumes that `npm run pack` has ran successfully

mkdir -p $PREFIX/lib

if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac OSX
    mv release/mac/orca.app $PREFIX/lib
else
    # Assume Linux
    mv release/linux-unpacked/ $PREFIX/lib/orca_app
fi

mkdir -p $PREFIX/bin
ORCA_ENTRY=$PREFIX/bin/orca
cp $RECIPE_DIR/bin/orca $ORCA_ENTRY
chmod +x $ORCA_ENTRY
