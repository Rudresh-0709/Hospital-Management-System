const express = require('express');
const path = require("path");
const session = require("express-session");
const app = express();
const con = require("../models/db");
const flash = require("express-flash");
const User = require('../models/userModel'); // Import the Mongoose model for User

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
app.use((req, res, next) => {
    res.locals.flashMessage = req.session.flashMessage;
    delete req.session.flashMessage; 
    next();
});
app.use(flash());


app.post('/patientlogin', (req, res) => {
  const { name, password } = req.body;
  const [firstName, lastName] = name.split(' ');

  const sql = 'SELECT * FROM patients WHERE first_name = ? AND last_name = ?';

  con.query(sql, [firstName, lastName], (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      const patient = result[0];
      if (patient.password === password) {
        const fullName = `${patient.first_name} ${patient.last_name}`;
        // Find or create the corresponding patient in MongoDB
        User.findOne({ name: fullName, role: 'patient' })
            .exec()
            .then(existingUser => {
                if (!existingUser) {
                    const newPatient = new User({
                        name: fullName,
                        email: patient.email || "", // Update if email is available
                        role: 'patient'
                    });
                    return newPatient.save();
                }
                return existingUser;
            })
            .then(user => {
                // Save the complete user document in session so it is available in other routes
                req.session.currentUser = user;
                // Optionally, save additional info if needed
                req.session.patientId = patient.patient_id;
                req.session.patientName = fullName;
                res.redirect('/patientdashboard');
            })
            .catch(err => {
                console.error("Error while processing patient login:", err);
                res.send("Internal server error");
            });
      } else {
        res.send('Incorrect password');
      }
    } else {
      res.send('Patient not found');
    }
  });
});

module.exports = app;