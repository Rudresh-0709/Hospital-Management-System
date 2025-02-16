const express = require('express');
const path = require("path");
const session = require("express-session");
const app = express();
const con = require("../models/db");
const flash = require("express-flash");
const mongoose = require('mongoose');
const User = require('../models/userModel');  // Import the Mongoose User model

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // Session lasts for 24 hours
    },
  })
);
app.use(flash());

app.post("/doctor_login_form", (req, res) => {
    var doctorloginquery = `SELECT * FROM doctors WHERE doctor_name = ?`;
    const { doctor_name, doctor_password } = req.body;
    con.query(doctorloginquery, [doctor_name], function (error, doctordetails) {
        if (error) {
            throw error;
        }
        if (doctordetails.length && doctordetails[0].doctor_password === doctor_password) {
            // Successful MySQL login for the doctor
            // Now find or create corresponding doctor in MongoDB
            User.findOne({ name: doctor_name, role: 'doctor' })
                .exec()
                .then(existingUser => {
                    if (!existingUser) {
                        // Create a new User document for the doctor
                        const newDoctor = new User({
                            name: doctor_name,
                            email: '', // or use a relevant field from doctordetails[0] if available
                            role: 'doctor'
                        });
                        return newDoctor.save();
                    }
                    return existingUser;
                })
                .then(user => {
                    // Store full user information in session
                    req.session.currentUser = user;
                    req.session.doctor_name = doctor_name;
                    res.redirect("/doctoradmin");
                })
                .catch(err => {
                    console.error("Error creating or retrieving doctor user:", err);
                    req.flash("error", "Internal server error");
                    res.redirect("/admin/doctor_login_form");
                });
        } else {
            req.flash("error", "Invalid username or password");
            res.redirect("/admin/doctor_login_form");
        }
    });
});

module.exports = app;