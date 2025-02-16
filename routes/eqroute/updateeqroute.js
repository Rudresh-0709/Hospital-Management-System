const express = require('express');
const app = express();
const con = require("../../models/db");
const session = require('express-session');
const flash = require('express-flash');

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

app.post("/update_equipment", (req, res) => {
  var idquery = `UPDATE equipments SET count=? WHERE equipment_name = ?`;
  var {equipment_name,count} = req.body;
  con.query(idquery, [count,equipment_name], function (error, result) {
    if (error) {
      throw error;
    }
    else {
      res.redirect("/admin/equipment");
      req.flash('success', 'Equipment updated Successfully');
      console.log("done");
    }

  })
})

module.exports = app;