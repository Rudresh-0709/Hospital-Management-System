require('dotenv').config();

const { createConnection } = require('mysql2');
var con = createConnection({
    host: "localhost",
    user: "root",
    password: process.env.DB_PASS,
    database: "hospital"
});
con.connect(function (error) {
    if (error) { throw error; }
    else console.log("result");
})
module.exports=con;