
const express = require('express');
const app = express();
const con = require("../models/db");
const session = require('express-session');
const flash = require('express-flash');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require("../models/userModel");  // Import the MongoDB User model
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

app.post("/new_patient", (req, res) => {
    const {
        first_name, last_name, dob, gender, contact_number, email, address,
        emergency_name, relationship, emergency_contact,
        reason_for_admission, doctor_assigned, ward_preference, room_number,password
    } = req.body;

    con.beginTransaction((transactionError) => {
        if (transactionError) {
            console.error("Transaction Error:", transactionError);
            req.session.flashMessage = { type: 'error', message: "An error occurred while starting the transaction." };
            return res.redirect('/admin/patient');
        }

        const patientQuery = `INSERT INTO patients (first_name, last_name, dob, gender, contact_number, email, address, password) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        con.query(patientQuery, [first_name, last_name, dob, gender, contact_number, email, address, password], (patientError, patientResult) => {
            if (patientError) {
                return con.rollback(() => {
                    console.error("Patient Insert Error:", patientError);
                    req.session.flashMessage = { type: 'error', message: "Error inserting patient details." };
                    return res.redirect('/admin/patient');
                });
            }

            const patient_id = patientResult.insertId;

            const emergencyQuery = `INSERT INTO emergency (patient_id, emergency_name, relationship, emergency_contact) 
                                     VALUES (?, ?, ?, ?)`;
            con.query(emergencyQuery, [patient_id, emergency_name, relationship, emergency_contact], (emergencyError) => {
                if (emergencyError) {
                    return con.rollback(() => {
                        console.error("Emergency Insert Error:", emergencyError);
                        req.session.flashMessage = { type: 'error', message: "Error inserting emergency details." };
                        return res.redirect('/admin/patient');
                    });
                }

                const admitQuery = `INSERT INTO admit (patient_id, reason_for_admission, doctor_assigned, ward_preference, room_number) 
                                    VALUES (?, ?, ?, ?, ?)`;
                con.query(admitQuery, [patient_id, reason_for_admission, doctor_assigned, ward_preference, room_number], (admitError, admitResult) => {
                    if (admitError) {
                        return con.rollback(() => {
                            console.error("Admit Insert Error:", admitError);
                            req.session.flashMessage = { type: 'error', message: "Error inserting admission details." };
                            return res.redirect('/admin/patient');
                        });
                    }

                    const admit_id = admitResult.insertId;

                    let badgeCount = 0;
                    let badgeIds = [];
                    let attachments = [];

                    for (let i = 0; i < 3; i++) {
                        const badgeQuery = `INSERT INTO badge (admit_id) VALUES (?)`;
                        con.query(badgeQuery, [admit_id], (badgeError, badgeResult) => {
                            if (badgeError) {
                                return con.rollback(() => {
                                    console.error("Badge Insert Error:", badgeError);
                                    req.session.flashMessage = { type: 'error', message: "Error creating badges." };
                                    return res.redirect('/admin/patient');
                                });
                            }

                            const badge_id = badgeResult.insertId;
                            badgeIds.push(badge_id);

                            const badgeQRCodeData = JSON.stringify({
                                visit_admit_id: admit_id,
                                badge_id: badge_id,
                                patient_name: `${first_name} ${last_name}`,
                            });
                            const qrFilePath = path.join(__dirname, `../qrcodes/badge_${badge_id}.png`);

                            QRCode.toFile(qrFilePath, badgeQRCodeData, (qrErr) => {
                                if (qrErr) {
                                    return con.rollback(() => {
                                        console.error("QR Code Generation Error:", qrErr);
                                        req.session.flashMessage = { type: 'error', message: "Error generating QR codes." };
                                        return res.redirect('/admin/patient');
                                    });
                                }

                                attachments.push({ filename: `badge_${badge_id}.png`, path: qrFilePath });
                                badgeCount++;

                                if (badgeCount === 3) {
                                    const roomQuery = `UPDATE rooms SET is_occupied = 1 WHERE room_number = ? AND ward_preference = ?`;
                                    con.query(roomQuery, [room_number, ward_preference], async (roomError) => {
                                        if (roomError) {
                                            return con.rollback(() => {
                                                console.error("Room Update Error:", roomError);
                                                req.session.flashMessage = { type: 'error', message: "Error updating room status." };
                                                return res.redirect('/admin/patient');
                                            });
                                        }

                                        // con.commit(async (commitError) => {
                                        //     if (commitError) {
                                        //         return con.rollback(() => {
                                        //             console.error("Commit Error:", commitError);
                                        //             req.session.flashMessage = { type: 'error', message: "Transaction commit failed." };
                                        //             return res.redirect('/admin/patient');
                                        //         });
                                        //     }

                                        //     // **Insert into MongoDB User Collection**
                                        //     try {
                                        //         const newUser = new User({
                                        //             name: `${first_name} ${last_name}`,
                                        //             email: email,
                                        //             role: "patient",
                                        //             userId: Math.floor(100000 + Math.random() * 900000).toString() // Generate random 6-digit userId
                                        //         });

                                        //         await newUser.save();
                                        //         console.log("New patient added to MongoDB:", newUser);
                                        //     } catch (mongoError) {
                                        //         console.error("MongoDB Insert Error:", mongoError);
                                        //     }

                                        //     // Send email
                                        //     const transporter = nodemailer.createTransport({
                                        //         service: 'gmail',
                                        //         auth: {
                                        //             user: process.env.EMAIL_USER,
                                        //             pass: process.env.EMAIL_PASS,
                                        //         },
                                        //     });

                                        //     const mailOptions = {
                                        //         from: process.env.EMAIL_USER,
                                        //         to: email,
                                        //         subject: 'Admission Confirmation with Badge QR Codes',
                                        //         text: `Dear ${first_name} ${last_name},\n\nYou have been successfully admitted for ${reason_for_admission}. Your assigned doctor is ${doctor_assigned}, and your room is ${room_number} in the ${ward_preference} ward. Please find attached your visitor badges with QR codes.\n\nBest regards,\nHospital Management`,
                                        //         attachments,
                                        //     };

                                        //     transporter.sendMail(mailOptions, (emailErr) => {
                                        //         if (emailErr) {
                                        //             console.error("Email Sending Error:", emailErr);
                                        //             req.session.flashMessage = { type: 'error', message: "Patient admitted successfully, but email could not be sent." };
                                        //             return res.redirect('/admin/patient');
                                        //         }

                                        //         attachments.forEach(att => fs.unlink(att.path, () => { }));

                                        //         req.session.flashMessage = {
                                        //             type: 'success',
                                        //             message: `Patient admitted successfully! Email sent to ${email}. Badges created: ${badgeIds.join(', ')}.`
                                        //         };
                                        //         res.redirect('/admin/patient');
                                        //     });
                                        // });
                                    
                                        con.commit(async (commitError) => {
                                            if (commitError) {
                                                return con.rollback(() => {
                                                    console.error("Commit Error:", commitError);
                                                    req.session.flashMessage = { type: 'error', message: "Transaction commit failed." };
                                                    return res.redirect('/admin/patient');
                                                });
                                            }
                                        
                                            // **Insert Notifications for Doctor and Patient**
                                            const notificationQuery = `INSERT INTO notifications (doctor_assigned, patient_id, type, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, NOW())`;
                                        
                                            con.query(notificationQuery, [doctor_assigned, patient_id, 'New Patient Admission', `A new patient, ${first_name} ${last_name}, has been admitted.`, 0], (doctorNotifError) => {
                                                if (doctorNotifError) {
                                                    return con.rollback(() => {
                                                        console.error("Doctor Notification Error:", doctorNotifError);
                                                        req.session.flashMessage = { type: 'error', message: "Error sending notification to doctor." };
                                                        return res.redirect('/admin/patient');
                                                    });
                                                }
                                        
                                                con.query(notificationQuery, [null, patient_id, 'New Patient Admission', `Welcome, ${first_name} ${last_name}. You have been successfully admitted under Dr. ${doctor_assigned}.`, 0], async (patientNotifError) => {
                                                    if (patientNotifError) {
                                                        return con.rollback(() => {
                                                            console.error("Patient Notification Error:", patientNotifError);
                                                            req.session.flashMessage = { type: 'error', message: "Error sending notification to patient." };
                                                            return res.redirect('/admin/patient');
                                                        });
                                                    }
                                        
                                                    console.log("Notifications sent successfully.");
                                        
                                                    // **Insert into MongoDB User Collection**
                                                    try {
                                                        const newUser = new User({
                                                            name: `${first_name} ${last_name}`,
                                                            email: email,
                                                            role: "patient",
                                                            userId: Math.floor(100000 + Math.random() * 900000).toString() // Generate random 6-digit userId
                                                        });
                                        
                                                        await newUser.save();
                                                        console.log("New patient added to MongoDB:", newUser);
                                                    } catch (mongoError) {
                                                        console.error("MongoDB Insert Error:", mongoError);
                                                    }
                                        
                                                    // **Send Email**
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
                                                            req.session.flashMessage = { type: 'error', message: "Patient admitted successfully, but email could not be sent." };
                                                            return res.redirect('/admin/patient');
                                                        }
                                        
                                                        attachments.forEach(att => fs.unlink(att.path, () => { }));
                                        
                                                        req.session.flashMessage = {
                                                            type: 'success',
                                                            message: `Patient admitted successfully! Email sent to ${email}. Badges created: ${badgeIds.join(', ')}.`
                                                        };
                                                        res.redirect('/admin/patient');
                                                    });
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
});

module.exports = app;
