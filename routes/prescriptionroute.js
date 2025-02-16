const express = require('express');
const app = express();
const con = require("../models/db");
const session = require('express-session');
const flash = require('express-flash');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
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

app.post('/prescription', (req, res) => {
    const { diagnosis_id, patient_id, medicine_name, dosage, time, patient_type } = req.body;

    // Ensure at least one medicine is prescribed
    if (!medicine_name || medicine_name.length === 0) {
        return res.status(400).send("At least one medicine must be prescribed.");
    }
    let prescriptionQuery;
    // Insert prescription details
    if (patient_type == 'admitted') {
        prescriptionQuery = `INSERT INTO prescriptions (diagnosis_id, patient_id) VALUES (?, ?)`;
    } else {
        prescriptionQuery = `INSERT INTO prescriptions (diagnosis_id, appointment_id) VALUES (?, ?)`;
    }
    con.query(prescriptionQuery, [diagnosis_id, patient_id], (err, Result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error saving prescription");
        }
        const prescription_id = Result.insertId;
        let insertedCount = 0;

        // Insert medicines (looping through multiple medicines)
        const medicineQuery = `INSERT INTO prescription_medicines (prescription_id, medicine_name, dosage, time_of_intake) VALUES (?, ?, ?, ?)`;
        for (let i = 0; i < medicine_name.length; i++) {
            con.query(medicineQuery, [prescription_id, medicine_name[i], dosage[i], time[i]], (error, result) => {
                if (error) {
                    console.log(error);
                }
                insertedCount++;
                // When all medicines are inserted, generate PDF and send email
                if (insertedCount === medicine_name.length) {
                    generateAndSendPDF(diagnosis_id, prescription_id, patient_id, req, res);
                }
            });
        }
    });
});

function generateAndSendPDF(diagnosis_id, prescription_id, patient_id, req, res) {
    const diagnosisQuery = `
        SELECT d.*,
            CASE 
                WHEN d.patient_type = 'admitted' THEN CONCAT(p.first_name, ' ', p.last_name)
                ELSE a.appointee_name 
            END AS patient_name,
            CASE 
                WHEN d.patient_type = 'admitted' THEN p.email 
                ELSE a.appointee_email 
            END AS patient_email,
            doc.doctor_name AS doctor_name
        FROM diagnosis d
        JOIN doctors doc ON d.doctor_id = doc.doctor_id
        LEFT JOIN patients p ON d.patient_type = 'admitted' AND d.patient_id = p.patient_id
        LEFT JOIN appointments a ON d.patient_type <> 'admitted' AND d.patient_id = a.appointment_id
        WHERE d.diagnosis_id = ?
    `;

    con.query(diagnosisQuery, [diagnosis_id], (err, diagnosisResult) => {
        if (err || diagnosisResult.length === 0) {
            console.error('Error fetching diagnosis:', err);
            return res.status(500).send('Diagnosis not found');
        }

        const prescriptionQuery = `
            SELECT medicine_name AS name, dosage, time_of_intake AS time
            FROM prescription_medicines 
            WHERE prescription_id = ?
        `;

        con.query(prescriptionQuery, [prescription_id], (err, prescriptionResult) => {
            if (err) {
                console.error('Error fetching prescription:', err);
                return res.status(500).send('Error fetching prescription data');
            }

            const diagnosis = diagnosisResult[0];
            const medicines = prescriptionResult;
            const templatePath = path.join(__dirname, '../views/diagnosis_prescription.ejs');

            ejs.renderFile(templatePath, { diagnosis, medicines }, (err, html) => {
                if (err) {
                    console.error('Error rendering template:', err);
                    return res.status(500).send('Error generating report');
                }

                // Generate PDF using Puppeteer
                puppeteer.launch().then((browser) => {
                    browser.newPage().then((page) => {
                        page.setContent(html).then(() => {
                            // Ensure the prescriptions folder exists
                            const prescriptionsDir = path.join(__dirname, '../prescriptions');
                            if (!fs.existsSync(prescriptionsDir)) {
                                fs.mkdirSync(prescriptionsDir, { recursive: true });
                            }

                            const pdfPath = path.join(prescriptionsDir, `${diagnosis.patient_name}_report.pdf`);
                            page.pdf({ path: pdfPath, format: 'A4' }).then(() => {
                                browser.close();
                                sendEmailWithPDF(diagnosis.patient_name, diagnosis.patient_email, pdfPath);
                                // Instead of res.send, set flash message and redirect
                                req.flash('success', 'Prescription saved and emailed successfully.');
                                res.redirect('/doctoradmin');  // Change to your desired redirect route
                            }).catch((err) => console.error('Error generating PDF:', err));
                        });
                    });
                });
            });
        });
    });
}

function sendEmailWithPDF(patient_name, patient_email, pdfPath) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: patient_email,
        subject: 'Your Diagnosis & Prescription Report',
        text: `Dear ${patient_name},\n\nAttached is your diagnosis and prescription report.`,
        attachments: [{ filename: `${patient_name}_report.pdf`, path: pdfPath }]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Email sending failed:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

module.exports = app;