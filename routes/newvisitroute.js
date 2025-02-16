const express = require('express');
const app = express();
const path = require("path");
const con = require("../models/db");
const session = require('express-session');
const flash = require("express-flash");

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        secret: "your-secret-key",
        resave: false,
        saveUninitialized: true,
    })
);
app.use(flash());
app.use((req, res, next) => {
    res.locals.flashMessage = req.session.flashMessage;  // Make flash message available in views
    delete req.session.flashMessage;  // Clear the message after displaying it
    next();
});

app.post("/search_badges", (req, res) => {
    const { first_name, last_name } = req.body;
    const patientQuery = `
        SELECT patient_id 
        FROM patients 
        WHERE first_name = ? AND last_name = ?
    `;
    con.query(patientQuery, [first_name, last_name], (err, patientResult) => {
        if (err) {
            console.error("Error fetching patient_id:", err);
            req.flash("message", "Error fetching patient information.");
            return res.redirect("/admin/newvisitor");
        }

        if (patientResult.length === 0) {
            req.session.flashMessage="No patient found with the given name.";
            return res.redirect("/admin/newvisitor");
        }

        const patient_id = patientResult[0].patient_id;

        const admitQuery = `
            SELECT admit_id 
            FROM admit 
            WHERE patient_id = ? AND discharge_date IS NULL
        `;
        con.query(admitQuery, [patient_id], (err, admitResult) => {
            if (err) {
                console.error("Error fetching admit_id:", err);
                req.flash("message", "Error fetching admission information.");
                return res.redirect("/admin/newvisitor");
            }

            if (admitResult.length === 0) {
                req.session.flashMessage="No active admission found for this patient.";
                return res.redirect("/admin/newvisitor");
            }

            const admit_id = admitResult[0].admit_id;

            const badgeQuery = `
                SELECT badge_id 
                FROM badge 
                WHERE admit_id = ?
            `;
            con.query(badgeQuery, [admit_id], (err, badgeResult) => {
                if (err) {
                    console.error("Error fetching badge_id:", err);
                    req.flash("message", "Error fetching badge information.");
                    return res.redirect("/admin/newvisitor");
                }

                if (badgeResult.length === 0) {
                    req.session.flashMessage="No badges available for this admission.";
                    return res.redirect("/admin/newvisitor");
                }
                res.render("adminpage/newvisitor", {
                    admit_id:admit_id,
                    badges: badgeResult,
                    patients: [], // To keep the patient dropdown empty
                    message: req.flash("message"),
                });
            });
        });
    });
});


app.post("/assign_badge", (req, res) => {
    const { badge_id, admit_id } = req.body;

    const visitQuery = `
        INSERT INTO visits (badge_id, visit_time, visit_admit_id)
        VALUES (?, NOW(), ?)
    `;
    con.query(visitQuery, [badge_id, admit_id], function (error, result) {
        if (error) {
            console.error("Error inserting visit:", error);
            req.flash("message", "Error recording visit.");
            return res.redirect("/admin/newvisitor");
        }
        req.session.flashMessage = {
            type:'success',
            message:`Visit recorded successfully.`
        };
        return res.redirect("/admin/newvisitor");
    });
});

module.exports = app;