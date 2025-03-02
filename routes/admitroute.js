const express = require('express');
const app = express();
const con = require("../models/db");
const session = require('express-session');
const flash = require('express-flash');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

// app.post("/admit_patient", (req, res) => {
//     const { first_name, last_name, reason_for_admission, doctor_assigned, ward_preference, room_number, email } = req.body;

//     con.beginTransaction((transactionError) => {
//         if (transactionError) {
//             console.error("Transaction Error:", transactionError);
//             req.session.flashMessage = {
//                 type: 'error',
//                 message: 'Error starting transaction.',
//             };
//             return res.redirect('/admin/admit');
//         }

//         const patientQuery = `SELECT patient_id,email FROM patients WHERE first_name = ? AND last_name = ?`;
//         con.query(patientQuery, [first_name, last_name], (err, patientResult) => {
//             if (err || patientResult.length === 0) {
//                 return con.rollback(() => {
//                     console.error("Patient Fetch Error:", err || "Patient not found");
//                     req.session.flashMessage = {
//                         type: 'error',
//                         message: 'Patient not found or error fetching patient details.',
//                     };
//                     res.redirect('/admin/admit');
//                 });
//             }

//             const patient_id = patientResult[0].patient_id;
//             const emailadd = patientResult[0].email;

//             const admitQuery = `
//                 INSERT INTO admit (patient_id, reason_for_admission, doctor_assigned, ward_preference, room_number)
//                 VALUES (?, ?, ?, ?, ?)
//             `;
//             con.query(admitQuery, [patient_id, reason_for_admission, doctor_assigned, ward_preference, room_number], (admitErr, admitResult) => {
//                 if (admitErr) {
//                     return con.rollback(() => {
//                         console.error("Admit Insert Error:", admitErr);
//                         req.session.flashMessage = {
//                             type: 'error',
//                             message: 'Error admitting patient.',
//                         };
//                         res.redirect('/admin/admit');
//                     });
//                 }

//                 const admit_id = admitResult.insertId;
//                 let badgeCount = 0;
//                 let attachments = []; // To store QR code files for email attachment

//                 for (let i = 0; i < 3; i++) {
//                     const badgeQuery = `INSERT INTO badge (admit_id) VALUES (?)`;
//                     con.query(badgeQuery, [admit_id], function (badgeErr, badgeResult) {
//                         if (badgeErr) {
//                             return con.rollback(() => {
//                                 console.error("Badge Insert Error:", badgeErr);
//                                 req.session.flashMessage = {
//                                     type: 'error',
//                                     message: 'Error generating badges.',
//                                 };
//                                 res.redirect('/admin/admit');
//                             });
//                         }

//                         const badge_id = badgeResult.insertId;
//                         const badgeQRCodeData = JSON.stringify({
//                             visit_admit_id:admit_id,
//                             badge_id: badge_id,
//                             patient_name: `${first_name} ${last_name}`,
//                         });

//                         const qrFilePath = path.join(__dirname, `../qrcodes/badge_${badge_id}.png`);

//                         QRCode.toFile(qrFilePath, badgeQRCodeData, (qrErr) => {
//                             if (qrErr) {
//                                 return con.rollback(() => {
//                                     console.error("QR Code Generation Error:", qrErr);
//                                     req.session.flashMessage = {
//                                         type: 'error',
//                                         message: 'Error generating QR codes for badges.',
//                                     };
//                                     res.redirect('/admin/admit');
//                                 });
//                             }

//                             attachments.push({
//                                 filename: `badge_${badge_id}.png`,
//                                 path: qrFilePath,
//                             });

//                             badgeCount++;
//                             if (badgeCount === 3) {
//                                 // Prepare and send email with QR code attachments
//                                 const transporter = nodemailer.createTransport({
//                                     service: 'gmail',
//                                     auth: {
//                                         user: process.env.EMAIL_USER,
//                                         pass: process.env.EMAIL_PASS,
//                                     },
//                                 });

//                                 const mailOptions = {
//                                     from: process.env.EMAIL_USER,
//                                     to: emailadd,
//                                     subject: 'Admission Confirmation with Visitor Badges',
//                                     text: `
//                                         Dear ${first_name} ${last_name},

//                                         You have been successfully admitted for ${reason_for_admission}. Your assigned doctor is ${doctor_assigned}, and your room is ${room_number} in the ${ward_preference} ward.

//                                         Attached are your visitor badge QR codes.

//                                         Best regards,
//                                         Hospital Management
//                                     `,
//                                     attachments: attachments,
//                                 };

//                                 transporter.sendMail(mailOptions, (emailErr, info) => {
//                                     if (emailErr) {
//                                         return con.rollback(() => {
//                                             console.error("Email Error:", emailErr);
//                                             req.session.flashMessage = {
//                                                 type: 'warning',
//                                                 message: `Patient admitted, but email could not be sent. QR codes generated successfully.`,
//                                             };
//                                             res.redirect('/admin/admit');
//                                         });
//                                     }

//                                     con.commit((commitErr) => {
//                                         if (commitErr) {
//                                             return con.rollback(() => {
//                                                 console.error("Commit Error:", commitErr);
//                                                 req.session.flashMessage = {
//                                                     type: 'error',
//                                                     message: 'Transaction commit failed.',
//                                                 };
//                                                 res.redirect('/admin/admit');
//                                             });
//                                         }

//                                         // Delete QR code files after email is sent
//                                         attachments.forEach(att => fs.unlink(att.path, () => {}));

//                                         req.session.flashMessage = {
//                                             type: 'success',
//                                             message: `Patient admitted successfully! Email with QR codes sent to ${emailadd}.`,
//                                         };
//                                         res.redirect('/admin/admit');
//                                     });
//                                 });
//                             }
//                         });
//                     });
//                 }
//             });
//         });
//     });
// });

app.post("/admit_patient", (req, res) => {
    const { first_name, last_name, reason_for_admission, doctor_assigned, ward_preference, room_number } = req.body;

    con.beginTransaction((transactionError) => {
        if (transactionError) {
            console.error("Transaction Error:", transactionError);
            req.session.flashMessage = { type: 'error', message: 'Error starting transaction.' };
            return res.redirect('/admin/admit');
        }

        const patientQuery = `SELECT patient_id, email FROM patients WHERE first_name = ? AND last_name = ?`;
        con.query(patientQuery, [first_name, last_name], (err, patientResult) => {
            if (err || patientResult.length === 0) {
                return con.rollback(() => {
                    console.error("Patient Fetch Error:", err || "Patient not found");
                    req.session.flashMessage = { type: 'error', message: 'Patient not found or error fetching details.' };
                    res.redirect('/admin/admit');
                });
            }

            const patient_id = patientResult[0].patient_id;
            const emailadd = patientResult[0].email;

            const admitQuery = `INSERT INTO admit (patient_id, reason_for_admission, doctor_assigned, ward_preference, room_number) VALUES (?, ?, ?, ?, ?)`;
            con.query(admitQuery, [patient_id, reason_for_admission, doctor_assigned, ward_preference, room_number], (admitErr, admitResult) => {
                if (admitErr) {
                    return con.rollback(() => {
                        console.error("Admit Insert Error:", admitErr);
                        req.session.flashMessage = { type: 'error', message: 'Error admitting patient.' };
                        res.redirect('/admin/admit');
                    });
                }

                const admit_id = admitResult.insertId;
                let badgeCount = 0;
                let attachments = [];

                for (let i = 0; i < 3; i++) {
                    const badgeQuery = `INSERT INTO badge (admit_id) VALUES (?)`;
                    con.query(badgeQuery, [admit_id], (badgeErr, badgeResult) => {
                        if (badgeErr) {
                            return con.rollback(() => {
                                console.error("Badge Insert Error:", badgeErr);
                                req.session.flashMessage = { type: 'error', message: 'Error generating badges.' };
                                res.redirect('/admin/admit');
                            });
                        }

                        const badge_id = badgeResult.insertId;
                        const badgeQRCodeData = JSON.stringify({ visit_admit_id: admit_id, badge_id: badge_id, patient_name: `${first_name} ${last_name}` });
                        const qrFilePath = path.join(__dirname, `../qrcodes/badge_${badge_id}.png`);

                        QRCode.toFile(qrFilePath, badgeQRCodeData, (qrErr) => {
                            if (qrErr) {
                                return con.rollback(() => {
                                    console.error("QR Code Generation Error:", qrErr);
                                    req.session.flashMessage = { type: 'error', message: 'Error generating QR codes.' };
                                    res.redirect('/admin/admit');
                                });
                            }

                            attachments.push({ filename: `badge_${badge_id}.png`, path: qrFilePath });
                            badgeCount++;

                            if (badgeCount === 3) {
                                // **Insert Notifications for Doctor and Patient**
                                const notificationQuery = `INSERT INTO notifications (doctor_assigned, patient_id, type, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, NOW())`;

                                con.query(notificationQuery, [doctor_assigned, patient_id, 'New Admission', `Patient ${first_name} ${last_name} admitted.`, 0], (doctorNotifErr) => {
                                    if (doctorNotifErr) {
                                        return con.rollback(() => {
                                            console.error("Doctor Notification Error:", doctorNotifErr);
                                            req.session.flashMessage = { type: 'error', message: "Error notifying doctor." };
                                            res.redirect('/admin/admit');
                                        });
                                    }

                                    con.query(notificationQuery, [null, patient_id, 'Admission Confirmation', `Welcome ${first_name} ${last_name}, admitted under Dr. ${doctor_assigned}.`, 0], (patientNotifErr) => {
                                        if (patientNotifErr) {
                                            return con.rollback(() => {
                                                console.error("Patient Notification Error:", patientNotifErr);
                                                req.session.flashMessage = { type: 'error', message: "Error notifying patient." };
                                                res.redirect('/admin/admit');
                                            });
                                        }

                                        console.log("Notifications sent successfully.");

                                        // **Send Email**
                                        const transporter = nodemailer.createTransport({
                                            service: 'gmail',
                                            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
                                        });

                                        const mailOptions = {
                                            from: process.env.EMAIL_USER,
                                            to: emailadd,
                                            subject: 'Admission Confirmation with Visitor Badges',
                                            text: `Dear ${first_name} ${last_name},\n\nYou have been successfully admitted for ${reason_for_admission}. Your assigned doctor is ${doctor_assigned}, and your room is ${room_number} in the ${ward_preference} ward.\n\nAttached are your visitor badge QR codes.\n\nBest regards,\nHospital Management`,
                                            attachments: attachments,
                                        };

                                        transporter.sendMail(mailOptions, (emailErr) => {
                                            if (emailErr) {
                                                return con.rollback(() => {
                                                    console.error("Email Error:", emailErr);
                                                    req.session.flashMessage = { type: 'warning', message: `Patient admitted, but email could not be sent.` };
                                                    res.redirect('/admin/admit');
                                                });
                                            }

                                            con.commit((commitErr) => {
                                                if (commitErr) {
                                                    return con.rollback(() => {
                                                        console.error("Commit Error:", commitErr);
                                                        req.session.flashMessage = { type: 'error', message: 'Transaction commit failed.' };
                                                        res.redirect('/admin/admit');
                                                    });
                                                }

                                                // Delete QR code files after email is sent
                                                attachments.forEach(att => fs.unlink(att.path, () => { }));

                                                req.session.flashMessage = {
                                                    type: 'success',
                                                    message: `Patient admitted successfully! Email sent to ${emailadd}.`,
                                                };
                                                res.redirect('/admin/admit');
                                            });
                                        });
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