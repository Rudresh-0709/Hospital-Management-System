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
    res.locals.flashMessage = req.session.flashMessage;  // Make flash message available in views
    delete req.session.flashMessage;  // Clear the message after displaying it
    next();
});


app.post("/new_patient", (req, res) => {
    const {
        first_name, last_name, dob, gender, contact_number, email, address,
        emergency_name, relationship, emergency_contact,
        reason_for_admission, doctor_assigned, ward_preference, room_number
    } = req.body;

    // Begin transaction
    con.beginTransaction((transactionError) => {
        if (transactionError) {
            console.error("Transaction Error:", transactionError);
            req.session.flashMessage = {
                type:'error',
                message:"An error occurred while starting the transaction."
            };
            return res.redirect('/admin/patient');
        }

        const patientQuery = `INSERT INTO patients (first_name, last_name, dob, gender, contact_number, email, address) 
                               VALUES (?, ?, ?, ?, ?, ?, ?)`;
        con.query(patientQuery, [first_name, last_name, dob, gender, contact_number, email, address], (patientError, patientResult) => {
            if (patientError) {
                return con.rollback(() => {
                    console.error("Patient Insert Error:", patientError);
                    req.session.flashMessage = {
                        type:'error',
                        message:"Error inserting patient details."
                    };
                    return res.redirect('/admin/patient');
                });
            }

            const patient_id = patientResult.insertId;

            // Insert into emergency table
            const emergencyQuery = `INSERT INTO emergency (patient_id, emergency_name, relationship, emergency_contact) 
                                     VALUES (?, ?, ?, ?)`;
            con.query(emergencyQuery, [patient_id, emergency_name, relationship, emergency_contact], (emergencyError) => {
                if (emergencyError) {
                    return con.rollback(() => {
                        console.error("Emergency Insert Error:", emergencyError);
                        req.session.flashMessage = {
                            type:'error',
                            message:"Error inserting emergency details."
                        };
                        return res.redirect('/admin/patient');
                    });
                }

                // Insert into admit table
                const admitQuery = `INSERT INTO admit (patient_id, reason_for_admission, doctor_assigned, ward_preference, room_number) 
                                    VALUES (?, ?, ?, ?, ?)`;
                con.query(admitQuery, [patient_id, reason_for_admission, doctor_assigned, ward_preference, room_number], (admitError, admitResult) => {
                    if (admitError) {
                        return con.rollback(() => {
                            console.error("Admit Insert Error:", admitError);
                            req.session.flashMessage = {
                                type:'error',
                                message:"Error inserting admission details."
                            };
                            return res.redirect('/admin/patient');
                        });
                    }

                    const admit_id = admitResult.insertId;

                    // Insert 3 badges and generate QR codes
                    let badgeCount = 0;
                    let badgeIds = [];
                    let attachments = [];

                    for (let i = 0; i < 3; i++) {
                        const badgeQuery = `INSERT INTO badge (admit_id) VALUES (?)`;
                        con.query(badgeQuery, [admit_id], (badgeError, badgeResult) => {
                            if (badgeError) {
                                return con.rollback(() => {
                                    console.error("Badge Insert Error:", badgeError);
                                    req.session.flashMessage = {
                                        type:'error',
                                        message:"Error creating badges."
                                    };
                                    return res.redirect('/admin/patient');
                                });
                            }

                            const badge_id = badgeResult.insertId;
                            badgeIds.push(badge_id);

                            // Generate QR code and save it
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
                                            type:'error',
                                            message:"Error generating QR codes."
                                        };
                                        return res.redirect('/admin/patient');
                                    });
                                }

                                attachments.push({ filename: `badge_${badge_id}.png`, path: qrFilePath });
                                badgeCount++;

                                if (badgeCount === 3) {
                                    // Update room status after all badges are inserted
                                    const roomQuery = `UPDATE rooms SET is_occupied = 1 WHERE room_number = ? AND ward_preference = ?`;
                                    con.query(roomQuery, [room_number, ward_preference], (roomError) => {
                                        if (roomError) {
                                            return con.rollback(() => {
                                                console.error("Room Update Error:", roomError);
                                                req.session.flashMessage = {
                                                    type:'error',
                                                    message:"Error updating room status."
                                                };
                                                return res.redirect('/admin/patient');
                                            });
                                        }

                                        // Commit the transaction
                                        con.commit((commitError) => {
                                            if (commitError) {
                                                return con.rollback(() => {
                                                    console.error("Commit Error:", commitError);
                                                    req.session.flashMessage = {
                                                        type:'error',
                                                        message:"Transaction commit failed."
                                                    };
                                                    return res.redirect('/admin/patient');
                                                });
                                            }

                                            // Send email with QR codes
                                            const transporter = nodemailer.createTransport({
                                                service: 'gmail',
                                                auth: {
                                                    user: process.env.EMAIL_USER,
                                                    pass: process.env.EMAIL_PASS,
                                                },
                                            });

                                            const mailOptions = {
                                                from: process.env.EMAIL_USER,
                                                to: email,
                                                subject: 'Admission Confirmation with Badge QR Codes',
                                                text: `Dear ${first_name} ${last_name},\n\nYou have been successfully admitted for ${reason_for_admission}. Your assigned doctor is ${doctor_assigned}, and your room is ${room_number} in the ${ward_preference} ward. Please find attached your visitor badges with QR codes.\n\nBest regards,\nHospital Management`,
                                                attachments,
                                            };

                                            transporter.sendMail(mailOptions, (emailErr) => {
                                                if (emailErr) {
                                                    console.error("Email Sending Error:", emailErr);
                                                    req.session.flashMessage = {
                                                        type:'error',
                                                        message:"Patient admitted successfully, but email could not be sent."
                                                    };
                                                    return res.redirect('/admin/patient');
                                                }

                                                // Delete QR code files after sending email
                                                attachments.forEach(att => fs.unlink(att.path, () => {}));

                                                req.session.flashMessage = {
                                                    type:'success',
                                                    message:`Patient admitted successfully! Email sent to ${email}. Badges created: ${badgeIds.join(', ')}.`
                                                };
                                                res.redirect('/admin/patient');
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
});

module.exports = app;

