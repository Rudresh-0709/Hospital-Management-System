const express = require('express');
const app = express();
const path = require("path");
const con = require("../models/db");
const session = require('express-session');
const flash = require("express-flash");

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    res.locals.flashMessage = req.session.flashMessage;
    delete req.session.flashMessage; 
    next();
});
app.use(
    session({
        secret: "your-secret-key",
        resave: false,
        saveUninitialized: true,
    })
);
app.use(flash());

app.post("/add_staff", (req, res) => {
    const { staff_first_name, staff_last_name, role, department, contact_number, email, hire_date, address, shift } = req.body;

    const query = `INSERT INTO hospital_staff (staff_first_name, staff_last_name, role, department, contact_number, email, hire_date, address, shift)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [staff_first_name, staff_last_name, role, department, contact_number, email, hire_date, address, shift];

    con.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error adding staff member.");
        }
        req.session.flashMessage = {
            type:'success',
            message:`New Staff member admitted.`
        };
        res.redirect("/admin/newstaff");
    });
});

module.exports = app;