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

app.post("/add_equipment", (req, res) => {
  var idquery = `INSERT INTO equipments(equipment_name,count) VALUE (?,?)`;
  var {equipment_name,count} = req.body;
  con.query(idquery, [equipment_name,count], function (error, result) {
    if (error) {
      throw error;
    }
    else {
      res.redirect("/admin/equipment");
      req.flash('success', 'Equipment added Successfully');
      console.log("done");
    }

  })
})

module.exports = app;