const { createConnection } = require('mysql2');
var con = createConnection({
    host: "localhost",
    user: "root",
    password: "dipti7981",
    database: "hospital"
});
con.connect(function (error) {
    if (error) { throw error; }
    else console.log("result");
})
module.exports=con;