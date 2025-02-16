const express = require('express');
const app = express();
const con = require("../models/db");
const session = require('express-session');
const flash = require('express-flash');
const nodemailer = require('nodemailer');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const uploadDir = path.join(__dirname, 'uploads/reports');

// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
    }
});
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
const upload = multer({ storage: storage });

app.post('/diagnosis', upload.single('attached_reports'), (req, res) => {
    const {
        patient,
        doctor_id,
        diagnosis_date,
        diagnosis_name,
        severity,
        symptoms,
        follow_up_date,
        notes,
        diagnosis_details,
        running,
        walking,
        swimming,
        cycling,
        yoga,
        diet_plan,
        patient_type
    } = req.body;

    // Handle file upload (check if file was uploaded)
    let attached_reports = req.file ? req.file.filename : null;

    // SQL Query to insert into diagnosis table
    const diagnosisQuery = `
        INSERT INTO diagnosis 
        (patient_id, doctor_id, patient_type, diagnosis_date, diagnosis_name, severity, symptoms, attached_reports, follow_up_date, notes, diagnosis_details, running, walking, swimming, cycling, yoga, diet_plan) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        patient,
        doctor_id,
        patient_type,
        diagnosis_date,
        diagnosis_name,
        severity,
        symptoms,
        attached_reports,
        follow_up_date || null, // If empty, store as NULL
        notes,
        diagnosis_details,
        running || null,
        walking || null,
        swimming || null,
        cycling || null,
        yoga || null,
        diet_plan || null
    ];

    con.query(diagnosisQuery, values, (err, result) => {
        if (err) {
            console.error('Error inserting diagnosis:', err);
            return res.status(500).send('Error saving diagnosis');
        }
        const diagnosis_id = result.insertId; // Get the inserted diagnosis ID
        req.session.patient_id = patient;
        req.session.patient_type = patient_type;
        req.session.diagnosis_id = diagnosis_id;
        // Redirect to prescription page with diagnosis_id and patient_id
        res.redirect(`/doctoradmin/prescription?diagnosis_id=${diagnosis_id}&patient_id=${patient}&patient_type=${patient_type}`);
    });
});
module.exports=app;