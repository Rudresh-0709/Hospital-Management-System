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
app.use((req, res, next) => {
    res.locals.flashMessage = req.session.flashMessage;
    delete req.session.flashMessage; // Clear flash message after use
    next();
});

app.post("/discharge_patient", (req, res) => {
    var idquery = `SELECT patient_id FROM patients WHERE first_name = ? AND last_name = ?`;

    var { first_name, last_name, reason_for_admission } = req.body;

    con.query(idquery, [first_name, last_name], function (error, result) {
        if (error) {
            req.session.flashMessage = {
                type: 'error',
                message: 'Error fetching patient details.'
            };
            return res.redirect('/admin/discharge'); // Adjust the redirect path as needed
        }

        if (result.length === 0) {
            req.session.flashMessage = {
                type: 'error',
                message: 'Patient not found'
            };
            return res.redirect('/admin/discharge');
        }

        var patient_id = result[0].patient_id;

        var hasrecoveredquery = `SELECT doctor_assigned, room_number, admit_id FROM admit WHERE patient_id = ? AND discharge_date IS NULL`;
        con.query(hasrecoveredquery, [patient_id], function (error, admitResult) {
            if (error) {
                req.session.flashMessage = {
                    type: 'error',
                    message: 'Error checking recovery status.'
                };
                return res.redirect('/admin/discharge');
            }

            if (admitResult.length === 0) {
                req.session.flashMessage = {
                    type: 'error',
                    message: 'Patient is not admitted or already discharged.'
                };
                return res.redirect('/admin/discharge');
            }

            var { room_number, admit_id, doctor_assigned } = admitResult[0];

            var dischargequery = `
                UPDATE admit
                SET discharge_date = NOW(), reason_for_admission = ?
                WHERE admit_id = ?
            `;
            con.query(dischargequery, [reason_for_admission, admit_id], function (error) {
                if (error) {
                    req.session.flashMessage = {
                        type: 'error',
                        message: 'Error discharging patient.'
                    };
                    return res.redirect('/admin/discharge');
                }

                var roomquery = `UPDATE rooms SET is_occupied = 0 WHERE room_number = ?`;
                con.query(roomquery, [room_number], function (error) {
                    if (error) {
                        req.session.flashMessage = {
                            type: 'error',
                            message: 'Error updating room status.'
                        };
                        return res.redirect('/admin/discharge');
                    }
                    // 
                    const notificationQuery = `INSERT INTO notifications (doctor_assigned, patient_id, type, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, NOW())`;

                    con.query(notificationQuery, [doctor_assigned, patient_id, 'Patient Discharge Update', `Patient ${first_name} ${last_name} has been discharged.`, 0], (NotifErr) => {
                        if (NotifErr) {
                            return con.rollback(() => {
                                console.error("Doctor Notification Error:", NotifErr);
                                req.session.flashMessage = { type: 'error', message: "Error notifying doctor." };
                                res.redirect('/admin/admit');
                            });
                        }
                        else {
                            req.session.flashMessage = {
                                type: 'success',
                                message:`Patient ${first_name} ${last_name} discharged successfully, and room ${room_number} is now available.`
                            };
                            res.redirect('/admin/discharge');
                        }
                    })
                });
            });
        });
    });
});

module.exports = app;
