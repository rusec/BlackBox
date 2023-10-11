"use strict";
const fs = require('fs');
const key = process.argv[2];
const key_two = process.argv[3];
const path = require('path');
const db_path = path.join(__dirname, '../modules/util/db.js');
const password_gen = path.join(__dirname, '../modules/password-generator.js');
function replaceKey(path, key) {
    var file = fs.readFileSync(path, 'utf-8');
    console.log(`Setting up key`);
    file = file.replace('"shrimp_key"', `Buffer.from([${[...Buffer.from(key, 'utf-8')]}]).toString('hex')`);
    fs.writeFileSync(path, file, 'utf-8');
}
replaceKey(db_path, key);
replaceKey(password_gen, key_two);
//# sourceMappingURL=prebuild.js.map