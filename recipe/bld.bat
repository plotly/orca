call npm install
call npm run pack
move release\win-unpacked "%PREFIX%\orca_app"
copy "%RECIPE_DIR%\bin\orca.cmd" "%PREFIX%\"
