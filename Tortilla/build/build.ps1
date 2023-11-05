$SALT=$(node -e 'const crypto = require(\"crypto\"); console.log(crypto.randomBytes(256).toString(\"hex\"));')
$SALT_2=$(node -e 'const crypto = require(\"crypto\"); console.log(crypto.randomBytes(256).toString(\"hex\"));')
node ./build/prebuild.js $SALT $SALT_2
tsc  
pkg --out-path releases/latest -t 'node16-linux,node16-win,node16-macos,node16-linux-x64,node16-win-x64,node16-macos-x64' ./dist/src/index.js 
node ./build/postbuild.js $SALT $SALT_2