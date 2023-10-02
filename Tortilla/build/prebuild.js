const fs = require('fs')
const key = process.argv[2]
const path = require('path')
const db_path = path.join(__dirname, '../modules/util/db.js')


var db = fs.readFileSync(db_path, 'utf-8')
console.log(`Setting up key`)
db = db.replace('"shrimp_key"', `"${key}"`)
fs.writeFileSync(db_path, db, 'utf-8')
