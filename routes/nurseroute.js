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
    res.locals.flashMessage = req.session.flashMessage;  // Make flash message available in views
    delete req.session.flashMessage;  // Clear the message after displaying it
    next();
});
app.post("/new_nurse",(req,res)=>{
    const{name,email,phone_number,specialization,role,shift,ward_assigned}=req.body;
    const nursequery=`INSERT INTO nurses(name,email,phone_number,specialization,role,shift,ward_assigned,available) VALUE(?,?,?,?,?,?,?,1)`;
    con.query(nursequery,[name,email,phone_number,specialization,role,shift,ward_assigned],(nurseerror,nurseresult)=>{
        if(nurseerror){
            console.error("Patient Insert Error:", patientError);
                req.session.flashMessage = {
                    type:'error',
                    message:"Error inserting nurse details."
                };
            return res.redirect('/admin/nurse');
        }
        req.session.flashMessage = {
            type:'success',
            message:`Nurse hired successfully.`
        };
        res.redirect('/admin/nurse');
    })
})
module.exports=app;