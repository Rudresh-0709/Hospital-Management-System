// const express = require('express');
// const Jimp = require('jimp');
// const multer = require('multer');
// const QRCode = require('qrcode-reader');
// const app = express();
// const path = require("path");
// const con = require("../models/db");
// const session = require('express-session');
// const flash = require("express-flash");
// const fs = require('fs');


// app.set('view engine', 'ejs');
// app.use(express.static(path.join(__dirname, 'public')));

// app.use(
//     session({
//         secret: "your-secret-key",
//         resave: false,
//         saveUninitialized: true,
//     })
// );
// app.use(flash());
// app.use((req, res, next) => {
//     res.locals.flashMessage = req.session.flashMessage;  // Make flash message available in views
//     delete req.session.flashMessage;  // Clear the message after displaying it
//     next();
// });
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir);
// }
// const upload = multer({
//     dest: 'uploads/', // Temporary folder for storing uploaded images
//     fileFilter: (req, file, cb) => {
//       const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
//       if (!allowedTypes.includes(file.mimetype)) {
//         return cb(new Error('Only JPEG, PNG, and GIF files are allowed.'));
//       }
//       cb(null, true);
//     }
//   });



// app.post('/api/decode-qr', upload.single('qrImage'), (req, res) => {
//     const imagePath = req.file.path; // Path of the uploaded image

//     // Check if the image file exists
//     if (!fs.existsSync(imagePath)) {
//         return res.status(400).send({ message: "Image file not found." });
//     }

//     // Read the image using Jimp
//     Jimp.read(imagePath)
//         .then(image => {
//             // Use qrcode library to decode the QR code from the image
//             QRCode.decode(image.bitmap, (err, value) => {
//                 if (err) {
//                     console.error("Error decoding QR code:", err);
//                     return res.status(400).send({ message: "Invalid QR code." });
//                 }

//                 try {
//                     const qrData = JSON.parse(value.result); // Parse the result as JSON

//                     const visitQuery = `
//                         INSERT INTO visits (visit_time, visit_admit_id, badge_id)
//                         VALUES (NOW(), ?, ?)
//                     `;
//                     con.query(visitQuery, [qrData.visit_admit_id, qrData.badge_id], (err, result) => {
//                         if (err) {
//                             console.error("Error inserting visit:", err);
//                             return res.status(500).send({ message: "Error recording visit." });
//                         }
//                         res.status(200).send({ message: "Visit recorded successfully." });
//                     });
//                 } catch (e) {
//                     console.error("Error parsing QR code data:", e);
//                     return res.status(400).send({ message: "Invalid QR code format." });
//                 }
//             });
//         })
//         .catch(err => {
//             console.error("Error reading image:", err);
//             res.status(500).send({ message: "Error processing image." });
//         });
// });



// module.exports=app;
const express = require('express');
const Jimp = require('jimp');
const multer = require('multer');
const jsQR = require('jsqr'); // Import jsQR
const app = express();
const path = require("path");
const con = require("../models/db");
const session = require('express-session');
const flash = require("express-flash");
const fs = require('fs');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        secret: "your-secret-key",
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

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({
    dest: 'uploads/', // Temporary folder for storing uploaded images
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only JPEG, PNG, and GIF files are allowed.'));
        }
        cb(null, true);
    }
});

app.post('/api/decode-qr', upload.single('qrImage'), (req, res) => {
    const imagePath = req.file.path; // Path of the uploaded image

    // Check if the image file exists
    if (!fs.existsSync(imagePath)) {
        return res.status(400).send({ message: "Image file not found." });
    }

    // Read the image using Jimp
    Jimp.read(imagePath)
        .then(image => {
            // Convert the image to a raw pixel array
            const rawImageData = new Uint8Array(image.bitmap.data);

            // Use jsQR to decode the QR code
            const code = jsQR(rawImageData, image.bitmap.width, image.bitmap.height);

            if (code) {
                try {
                    const qrData = JSON.parse(code.data); // Parse the result as JSON

                    const visitQuery = `
                        INSERT INTO visits (visit_time, visit_admit_id, badge_id)
                        VALUES (NOW(), ?, ?)
                    `;
                    con.query(visitQuery, [qrData.visit_admit_id, qrData.badge_id], (err, result) => {
                        if (err) {
                            console.error("Error inserting visit:", err);
                            return res.status(500).send({ message: "Error recording visit." });
                        }
                        res.status(200).send({ message: "Visit recorded successfully." });
                    });
                } catch (e) {
                    console.error("Error parsing QR code data:", e);
                    return res.status(400).send({ message: "Invalid QR code format." });
                }
            } else {
                return res.status(400).send({ message: "QR code not detected." });
            }
        })
        .catch(err => {
            console.error("Error reading image:", err);
            res.status(500).send({ message: "Error processing image." });
        });
});

module.exports = app;
