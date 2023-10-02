const fs = require('fs')
const key = process.argv[2]
const path = require('path')
const db_path = path.join(__dirname, '../modules/util/db.js')

console.log(`clean up...`)
//replace salt in db
var db = fs.readFileSync(db_path, 'utf-8')
db = db.replace(`"${key}"`, '"shrimp_key"')
fs.writeFileSync(db_path, db, 'utf-8')
