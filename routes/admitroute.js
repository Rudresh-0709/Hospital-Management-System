const express = require('express');
const app = express();
const con = require("../models/db");
const session = require('express-session');
const flash = require('express-flash');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
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
    delete req.session.flashMessage; 
    next();
});

app.post("/admit_patient", (req, res) => {
    const { first_name, last_name, reason_for_admission, doctor_assigned, ward_preference, room_number, email } = req.body;

    con.beginTransaction((transactionError) => {
        if (transactionError) {
            console.error("Transaction Error:", transactionError);
            req.session.flashMessage = {
                type: 'error',
                message: 'Error starting transaction.',
            };
            return res.redirect('/admin/admit');
        }

        const patientQuery = `SELECT patient_id,email FROM patients WHERE first_name = ? AND last_name = ?`;
        con.query(patientQuery, [first_name, last_name], (err, patientResult) => {
            if (err || patientResult.length === 0) {
                return con.rollback(() => {
                    console.error("Patient Fetch Error:", err || "Patient not found");
                    req.session.flashMessage = {
                        type: 'error',
                        message: 'Patient not found or error fetching patient details.',
                    };
                    res.redirect('/admin/admit');
                });
            }

            const patient_id = patientResult[0].patient_id;
            const emailadd = patientResult[0].email;

            const admitQuery = `
                INSERT INTO admit (patient_id, reason_for_admission, doctor_assigned, ward_preference, room_number)
                VALUES (?, ?, ?, ?, ?)
            `;
            con.query(admitQuery, [patient_id, reason_for_admission, doctor_assigned, ward_preference, room_number], (admitErr, admitResult) => {
                if (admitErr) {
                    return con.rollback(() => {
                        console.error("Admit Insert Error:", admitErr);
                        req.session.flashMessage = {
                            type: 'error',
                            message: 'Error admitting patient.',
                        };
                        res.redirect('/admin/admit');
                    });
                }

                const admit_id = admitResult.insertId;
                let badgeCount = 0;
                let attachments = []; // To store QR code files for email attachment

                for (let i = 0; i < 3; i++) {
                    const badgeQuery = `INSERT INTO badge (admit_id) VALUES (?)`;
                    con.query(badgeQuery, [admit_id], function (badgeErr, badgeResult) {
                        if (badgeErr) {
                            return con.rollback(() => {
                                console.error("Badge Insert Error:", badgeErr);
                                req.session.flashMessage = {
                                    type: 'error',
                                    message: 'Error generating badges.',
                                };
                                res.redirect('/admin/admit');
                            });
                        }

                        const badge_id = badgeResult.insertId;
                        const badgeQRCodeData = JSON.stringify({
                            visit_admit_id:admit_id,
                            badge_id: badge_id,
                            patient_name: `${first_name} ${last_name}`,
                        });

                        const qrFilePath = path.join(__dirname, `../qrcodes/badge_${badge_id}.png`);

                        QRCode.toFile(qrFilePath, badgeQRCodeData, (qrErr) => {
                            if (qrErr) {
                                return con.rollback(() => {
                                    console.error("QR Code Generation Error:", qrErr);
                                    req.session.flashMessage = {
                                        type: 'error',
                                        message: 'Error generating QR codes for badges.',
                                    };
                                    res.redirect('/admin/admit');
                                });
                            }

                            attachments.push({
                                filename: `badge_${badge_id}.png`,
                                path: qrFilePath,
                            });

                            badgeCount++;
                            if (badgeCount === 3) {
                                // Prepare and send email with QR code attachments
                                const transporter = nodemailer.createTransport({
                                    service: 'gmail',
                                    auth: {
                                        user: 'chauhanrudresh2005@gmail.com',
                                        pass: 'kemn rqkk hebi wzoc',
                                    },
                                });

                                const mailOptions = {
                                    from: 'chauhanrudresh2005@gmail.com',
                                    to: emailadd,
                                    subject: 'Admission Confirmation with Visitor Badges',
                                    text: `
                                        Dear ${first_name} ${last_name},

                                        You have been successfully admitted for ${reason_for_admission}. Your assigned doctor is ${doctor_assigned}, and your room is ${room_number} in the ${ward_preference} ward.

                                        Attached are your visitor badge QR codes.

                                        Best regards,
                                        Hospital Management
                                    `,
                                    attachments: attachments,
                                };

                                transporter.sendMail(mailOptions, (emailErr, info) => {
                                    if (emailErr) {
                                        return con.rollback(() => {
                                            console.error("Email Error:", emailErr);
                                            req.session.flashMessage = {
                                                type: 'warning',
                                                message: `Patient admitted, but email could not be sent. QR codes generated successfully.`,
                                            };
                                            res.redirect('/admin/admit');
                                        });
                                    }

                                    con.commit((commitErr) => {
                                        if (commitErr) {
                                            return con.rollback(() => {
                                                console.error("Commit Error:", commitErr);
                                                req.session.flashMessage = {
                                                    type: 'error',
                                                    message: 'Transaction commit failed.',
                                                };
                                                res.redirect('/admin/admit');
                                            });
                                        }

                                        // Delete QR code files after email is sent
                                        attachments.forEach(att => fs.unlink(att.path, () => {}));

                                        req.session.flashMessage = {
                                            type: 'success',
                                            message: `Patient admitted successfully! Email with QR codes sent to ${emailadd}.`,
                                        };
                                        res.redirect('/admin/admit');
                                    });
                                });
                            }
                        });
                    });
                }
            });
        });
    });
});

module.exports = app;