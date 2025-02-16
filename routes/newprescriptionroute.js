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
app.post('/newprescription', (req, res) => {

    const { patient, patient_type, medicine_name, dosage, time } = req.body;
    const patient_id = patient;
    // Ensure at least one medicine is prescribed
    if (!medicine_name || medicine_name.length === 0) {
        return res.status(400).send("At least one medicine must be prescribed.");
    }

    let prescriptionQuery, queryParams;
    if (patient_type === 'admitted') {
        // For admitted patients, insert only patient_id
        prescriptionQuery = `INSERT INTO prescriptions (patient_id) VALUES (?)`;
    } else {
        // For outpatient prescription, we assume appointment_id is provided.
        prescriptionQuery = `INSERT INTO prescriptions (appointment_id) VALUES (?)`;
    }

    con.query(prescriptionQuery, [patient_id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error saving prescription");
        }
        const prescription_id = result.insertId;
        let insertedCount = 0;

        // Insert each prescribed medicine
        const medicineQuery = `INSERT INTO prescription_medicines (prescription_id, medicine_name, dosage, time_of_intake) VALUES (?, ?, ?, ?)`;
        for (let i = 0; i < medicine_name.length; i++) {
            con.query(medicineQuery, [prescription_id, medicine_name[i], dosage[i], time[i]], (error) => {
                if (error) {
                    console.error(error);
                }
                insertedCount++;
                if (insertedCount === medicine_name.length) {
                    // All medicines inserted, now query for patient details based on patient_type.
                    if (patient_type === 'admitted') {
                        const detailQuery = `
                            SELECT CONCAT(first_name, ' ', last_name) AS patient_name,
                                   email AS patient_email 
                            FROM patients 
                            WHERE patient_id = ?
                        `;
                        con.query(detailQuery, [patient_id], (err, detailsResult) => {
                            if (err || detailsResult.length === 0) {
                                console.error('Error fetching patient details:', err);
                                return res.status(500).send("Error fetching patient details");
                            }
                            const detailRecord = detailsResult[0];
                            const prescriptionInfo = { 
                                patient_id, 
                                patient_type, 
                                patient_name: detailRecord.patient_name, 
                                patient_email: detailRecord.patient_email 
                            };
                            generateAndSendPDF(prescription_id, prescriptionInfo, req, res);
                        });
                    } else {
                        const detailQuery = `
                            SELECT appointee_name AS patient_name,
                                   appointee_email AS patient_email 
                            FROM appointments 
                            WHERE appointment_id = ?
                        `;
                        con.query(detailQuery, [patient_id], (err, detailsResult) => {
                            if (err || detailsResult.length === 0) {
                                console.error('Error fetching appointment details:', err);
                                return res.status(500).send("Error fetching patient details");
                            }
                            const detailRecord = detailsResult[0];
                            const prescriptionInfo = { 
                                patient_id, 
                                appointment_id, 
                                patient_type, 
                                patient_name: detailRecord.patient_name, 
                                patient_email: detailRecord.patient_email 
                            };
                            generateAndSendPDF(prescription_id, prescriptionInfo, req, res);
                        });
                    }
                }
            });
        }
    });
});

function generateAndSendPDF(prescription_id, prescription, req, res) {
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
        const medicines = prescriptionResult;
        // Use a template that is designed for prescriptions only
        const templatePath = path.join(__dirname, '../views/prescription_report.ejs');
        ejs.renderFile(templatePath, { prescription, medicines }, (err, html) => {
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
                        const pdfPath = path.join(prescriptionsDir, `${prescription.patient_name}_prescription.pdf`);
                        page.pdf({ path: pdfPath, format: 'A4' }).then(() => {
                            browser.close();
                            sendEmailWithPDF(prescription.patient_name, prescription.patient_email, pdfPath);
                            req.flash('success', 'Prescription saved and emailed successfully.');
                            res.redirect('/doctoradmin'); // Change to your desired redirect route
                        }).catch((err) => console.error('Error generating PDF:', err));
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
            user: 'chauhanrudresh2005@gmail.com',
            pass: 'kemn rqkk hebi wzoc',
        },
    });

    const mailOptions = {
        from: 'chauhanrudresh2005@gmail.com',
        to: patient_email,
        subject: 'Your Prescription Report',
        text: `Dear ${patient_name},\n\nAttached is your prescription report.`,
        attachments: [{ filename: `${patient_name}_prescription.pdf`, path: pdfPath }]
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