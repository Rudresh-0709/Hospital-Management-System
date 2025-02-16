const express = require('express');
const app = express();
const con = require("../models/db");
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

app.post("/new_doctor", (req, res) => {
  var idquery = `INSERT INTO doctors(doctor_name, speciality, doctor_in, doctor_out,doctor_password) VALUE (?,?,?,?,?)`;
  var {doctor_name, speciality, doctor_in, doctor_out,doctor_password} = req.body;
  con.query(idquery, [doctor_name, speciality, doctor_in, doctor_out,doctor_password], function (error, result) {
    if (error) {
      throw error;
    }
    else {
      req.flash('success', 'Doctor Assigned Successfully');
      console.log("done");
    }

  })
})

module.exports = app;