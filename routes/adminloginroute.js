const express = require('express');
const path = require("path");
const session = require("express-session");
const app = express();
const con = require("../models/db");
const flash = require("express-flash");

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,cookie: {
        maxAge: 24 * 60 * 60 * 1000, // Session lasts for 24 hours
      },
  })
);
app.use(flash());

app.post("/admin_login_form", (req, res) => {
    var adminloginquery = `SELECT * FROM admin WHERE admin_name = ?`;
    const { admin_name, admin_password } = req.body;

    con.query(adminloginquery, [admin_name], function (error, admindetails) {
        if (error) {
            console.error("Database error:", error);
            req.flash("error", "An internal error occurred. Please try again.");
            return res.redirect("/admin/admin_login_form");
        }

        if (admindetails.length === 0) {
            req.flash("error", "Invalid username or password");
            return res.redirect("/admin/admin_login_form");
        }

        if (admindetails[0].admin_password === admin_password) {
            req.session.admin_name = admin_name;
            return res.redirect("/admin");
        } else {
            req.flash("error", "Invalid username or password");
            return res.redirect("/admin_login_form");
        }
    });
});



module.exports = app;