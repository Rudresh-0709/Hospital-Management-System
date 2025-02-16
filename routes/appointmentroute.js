const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const session = require('express-session'); // Import session middleware
const con = require("../models/db");
const fs = require('fs');

const app = express();
const port = 3000;
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configure session middleware
app.use(session({
    secret: 'your-secret-key', // Replace with a secure key
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
    },
}));

// Middleware to pass flash message to views
app.use((req, res, next) => {
    res.locals.flashMessage = req.session.flashMessage; // Make flash message available in views
    delete req.session.flashMessage; // Clear the message after displaying it
    next();
});

// Multer storage setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        return cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// POST route for new appointment
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'chauhanrudresh2005@gmail.com', // Your Gmail address
        pass: 'kemn rqkk hebi wzoc',          // App password (not your Gmail password)
    },
});

app.post('/new_appointment', upload.single("documents"), (req, res) => {
    const { appointee_name, appointee_email, doctor_name, appointment_date, appointee_contact, appointment_time, purpose } = req.body;

    const query = `INSERT INTO appointments (appointee_name, appointee_email, appointee_contact, doctor_name, appointment_date, appointment_time, purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
        appointee_name,
        appointee_email,
        appointee_contact,
        doctor_name,
        appointment_date,
        appointment_time,
        purpose,
        'Pending',
    ];

    con.query(query, values, (err, result) => {
        if (err) {
            console.error("Error inserting appointment:", err);
            return res.status(500).send('Error saving appointment');
        }

        console.log("Uploaded files:", req.file);
        if (!req.file || req.file.length === 0) {
            console.log('No files were uploaded.');
        }

        // Send email confirmation
        const mailOptions = {
            from: 'chauhanrudresh2005@gmail.com', // Sender's email
            to: appointee_email,                 // Recipient's email
            subject: 'Appointment Confirmation',
            text: `Dear ${appointee_name},\n\nYour appointment request has been successfully made with the following details:\n\n
            - Doctor: ${doctor_name}
            - Date: ${appointment_date}
            - Time: ${appointment_time}
            - Purpose: ${purpose}\n\nWe will get back to you once your appointment is confirmed.\n\nBest regards,\nHospital Management`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }

            // Set flash message and redirect
            req.session.flashMessage = {
                type: 'success',
                message: `Appointment request made successfully! An email has been sent to ${appointee_email}.`,
            };
            res.redirect('/appointmentbook');
        });
    });
});

module.exports = app;
