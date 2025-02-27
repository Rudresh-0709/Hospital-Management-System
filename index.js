const express = require('express');
const path = require("path");
const session = require("express-session");
const app = express();
const con = require("./models/db");
const flash = require("express-flash");
const multer = require('multer');
const Jimp = require('jimp');
const QrCode = require('qrcode-reader');
const moment = require('moment');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');

const server = http.createServer(app);
const io = socketio(server);

app.use(express.json());

const User=require('./models/userModel.js');
const ChatMessage = require('./models/chatModel');
const chatNamespace = io.of('/chat');

function getRoomId(userId1, userId2) {
    return [userId1, userId2].sort().join("_"); // Sort to keep consistent
}

const activeSockets = new Map(); // Track active sockets for each user

chatNamespace.on('connection', async (socket) => {
    const { userId } = socket.handshake.query;  // ✅ MongoDB _id

    if (!userId) {
        console.warn("⚠️ No userId provided for socket connection.");
        return;
    }
    socket.join(userId);  // ✅ Join the room with MongoDB _id
    console.log(`📡 User ${userId} connected (Socket ID: ${socket.id})`);
    try {
        // ✅ Update user online status in DB
        await User.findByIdAndUpdate(userId, { is_online: true });

        // ✅ Notify all users (this was the issue: notifying everyone, not just allowedUsers)
        chatNamespace.emit('userOnline', { userId });

    } catch (err) {
        console.error("❌ Error updating user online status:", err);
    }

    socket.on('chatMessage', async ({ senderId, receiverId, message }) => {
        console.log(`📤 Message from ${senderId} to ${receiverId}:`, message);
    
        if (!senderId || !receiverId || !message) {
            console.error("⚠️ Missing sender, receiver, or message!");
            return;
        }
    
        try {
            const newMessage = new ChatMessage({
                sender: senderId,   
                receiver: receiverId, 
                message: message,
                timestamp: new Date()  // ✅ Add timestamp
            });
    
            await newMessage.save();
    
            // ✅ Include timestamp when emitting
            const messageData = {
                senderId,
                receiverId,
                message,
                timestamp: newMessage.timestamp // ✅ Ensure correct timestamp
            };
    
            // ✅ Emit to sender & receiver
            chatNamespace.to(senderId).emit("chatMessage", messageData);
            chatNamespace.to(receiverId).emit("chatMessage", messageData);
    
            console.log(`✅ Message sent with timestamp: ${newMessage.timestamp}`);
        } catch (err) {
            console.error("❌ Error saving message:", err);
        }
    });
    
    socket.on('disconnect', async () => {
        console.log(`🔌 User ${userId} disconnected.`);

        try {
            // ✅ Update user offline status in DB
            await User.findByIdAndUpdate(userId, { is_online: false });

            // ✅ Notify all users (same issue: notifying everyone)
            chatNamespace.emit('userOffline', { userId });

        } catch (err) {
            console.error("❌ Error updating user offline status:", err);
        }

        socket.leave(userId);
    });
});

mongoose.connect('mongodb://localhost:27017/chatdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB', err));

const patientroute = require('./routes/patientroute');
const adminloginroute = require('./routes/adminloginroute')
const admitroute = require('./routes/admitroute');
const dischargeroute = require('./routes/dischargeroute');
const visitroute = require('./routes/newvisitroute');
const newdoctorroute = require("./routes/newdoctorroute");
const updateeqroute = require('./routes/eqroute/updateeqroute');
const neweqroute = require('./routes/eqroute/neweqroute');
const newstaffroute = require('./routes/staffroute');
const doctorloginroute = require('./routes/doctorloginroute');
const appointmentroute = require('./routes/appointmentroute');
const visitqrroute = require('./routes/visitqrroute');
const patientloginroute = require('./routes/patientloginroute');
const nurseroute = require('./routes/nurseroute');
const diagnosisroute = require('./routes/diagnosisroute');
const prescriptionroute = require('./routes/prescriptionroute');
const newprescriptionroute = require('./routes/newprescriptionroute');
app.use('/uploads', express.static(path.join(__dirname, 'routes', 'chat', 'uploads')));

app.use('/profile-pictures', express.static(path.join(__dirname, 'routes/chat/uploads/Profile-pictures')));


app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
    },
}));
app.use(flash());
app.use((req, res, next) => {
    res.locals.flashMessage = req.session.flashMessage;  // Make flash message available in views
    delete req.session.flashMessage;  // Clear the message after displaying it
    next();
});

const chatRoutes = require('./routes/chat/chatroute');
app.use('/chat', chatRoutes);

app.get("/", (req, res) => {
    res.render("home");
})
app.get("/adminlogin", (req, res) => {
    res.render("adminpage/adminlogin");
})
app.get("/admin", (req, res) => {
    res.render("adminpage/admin");
})
app.get("/admin/patient", (req, res) => {
    var displayname = "SELECT * FROM patients p JOIN admit a ON p.patient_id=a.patient_id JOIN emergency e on e.patient_id=p.patient_id ";
    con.query(displayname, function (nameerror, nameresult) {
        if (nameerror) {
            console.log(nameerror);
        }
        else {
            var doctorname = `SELECT * FROM doctors`;
            con.query(doctorname, function (doctorerror, doctorresult) {
                if (doctorerror) {
                    console.log(doctorerror);
                }
                else {
                    var roomquery = `SELECT * FROM rooms WHERE is_occupied = 0`;
                    con.query(roomquery, function (roomerror, roomresult) {
                        if (roomerror) {
                            console.log(roomerror);
                        }
                        else {
                            res.render("adminpage/patient", {
                                patients: nameresult,
                                message: req.flash('message'),
                                doctors: doctorresult,
                                rooms: roomresult
                            });
                        }
                    })
                }
            })
        }
    })
})
app.get("/admin/admit", (req, res) => {
    var displayname = "SELECT p.patient_id, p.first_name,p.last_name, MAX(a.discharge_date) AS discharge_date FROM patients p JOIN admit a ON p.patient_id = a.patient_id WHERE a.discharge_date IS NOT NULL GROUP BY p.patient_id, p.first_name, p.last_name;";
    con.query(displayname, function (nameerror, nameresult) {
        if (nameerror) {
            console.log(nameerror);
        }
        else {
            var doctorname = `SELECT * FROM doctors`;
            con.query(doctorname, function (doctorerror, doctorresult) {
                if (doctorerror) {
                    console.log(doctorerror);
                }
                else {
                    var roomquery = `SELECT * FROM rooms WHERE is_occupied = 0`;
                    con.query(roomquery, function (roomerror, roomresult) {
                        if (roomerror) {
                            console.log(roomerror);
                        }
                        else {
                            res.render("adminpage/admit", {
                                patients: nameresult,
                                message: req.flash('message'),
                                doctors: doctorresult,
                                rooms: roomresult
                            });
                        }
                    })
                }
            })
        }
    })
})
app.get("/admin/discharge", (req, res) => {
    var displayname = `SELECT patients.patient_id, patients.first_name, patients.last_name 
        FROM patients 
        INNER JOIN admit ON patients.patient_id = admit.patient_id 
        WHERE admit.discharge_date IS NULL`;
    con.query(displayname, function (nameerror, nameresult) {
        if (nameerror) {
            console.log(nameerror);
        }
        else {
            res.render("adminpage/discharge", { patients: nameresult });
            console.log(nameresult);
        }
    })
})
app.get("/admin/newvisitor", (req, res) => {
    const displayPatientsQuery = `
        SELECT admit.admit_id, patients.patient_id, patients.first_name, patients.last_name
        FROM patients
        INNER JOIN admit ON patients.patient_id = admit.patient_id
        WHERE admit.discharge_date IS NULL
    `;

    con.query(displayPatientsQuery, function (error, patients) {
        if (error) {
            console.error("Error fetching patients:", error);
            res.status(500).send("Error fetching active patients.");
        } else {
            // Extract admit IDs to fetch badges
            res.render("adminpage/newvisitor", { patients: patients, badges: null });
        }
    });
});
app.get("/admin/patienthistory", (req, res) => {
    const { gender, ward_preference, sort } = req.query;

    let query = `
        SELECT * FROM patients p
        JOIN admit a ON p.patient_id = a.patient_id
        JOIN emergency e ON e.patient_id = a.patient_id
        WHERE 1=1
    `;
    if (gender) query += ` AND p.gender = '${gender}'`;
    if (ward_preference) query += ` AND a.ward_preference = '${ward_preference}'`;
    if (sort) {
        if (sort === "admission_date_asc") query += " ORDER BY a.admission_date ASC";
        if (sort === "admission_date_desc") query += " ORDER BY a.admission_date DESC";
        if (sort === "discharge_date_asc") query += " ORDER BY a.discharge_date ASC";
        if (sort === "discharge_date_desc") query += " ORDER BY a.discharge_date DESC";
    }

    con.query(query, function (error, patientdetails) {
        if (error) {
            console.error("Error fetching patient details:", error);
            return res.status(500).send("Error fetching patient details");
        }
        res.render("adminpage/patienthistory", { patientdetails: patientdetails });
    });
});
app.get("/admin/newdoctor", (req, res) => {
    res.render("adminpage/newdoctor", {
        message: req.flash('message')
    });
})
app.get("/admin/equipment", (req, res) => {
    var equipmentquery = `SELECT * FROM equipments`;
    con.query(equipmentquery, function (error, equipments) {
        if (error) {
            console.log(error);
        }
        else {
            res.render("adminpage/equipment", {
                equipments: equipments,
                message: req.flash('message')
            });
        }
    })
})
app.get("/admin/equipment/newequipment", (req, res) => {
    var equipmentquery = `SELECT * FROM equipments`;
    con.query(equipmentquery, function (error, equipments) {
        if (error) {
            console.log(error);
        }
        else {
            res.render("eqviews/newequipment", {
                equipments: equipments,
                message: req.flash('message')
            });
        }
    })
})
app.get("/admin/equipment/updateequipment", (req, res) => {
    var equipmentquery = `SELECT * FROM equipments`;
    con.query(equipmentquery, function (error, equipments) {
        if (error) {
            console.log(error);
        }
        else {
            res.render("eqviews/updateequipment", {
                equipments: equipments,
                message: req.flash('message')
            });
        }
    })
})
app.get("/admin/newstaff", (req, res) => {
    res.render("adminpage/newstaff", {
        message: req.flash('message')
    });
})
app.get("/get-total-amounts", (req, res) => {
    // Query to group total sales by day
    const query = `
        SELECT DATE(transaction_date) AS date, SUM(total_cost) AS total_sales
        FROM consumer_transactions
        GROUP BY DATE(transaction_date)
        ORDER BY DATE(transaction_date)`;

    con.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching total amounts:", err);
            return res.status(500).send("Error fetching data.");
        }

        // Process results to send an array of dates and total sales
        const totalAmountsByDate = results.map(row => ({
            date: row.date, // Transaction date
            total_sales: row.total_sales // Total sales on that date
        }));

        // Send the data as JSON
        res.json(totalAmountsByDate);
    });
});
app.get("/admin/pharmacy", (req, res) => {
    // Fetch products
    const productQuery = `SELECT * FROM medicine_products`;
    con.query(productQuery, (error, products) => {
        if (error) {
            console.log(error);
            return res.status(500).send("Error fetching products.");
        }

        // Fetch consumer transactions
        const consumerQuery = `SELECT * FROM consumer_transactions`;
        con.query(consumerQuery, (error, consumer) => {
            if (error) {
                console.log(error);
                return res.status(500).send("Error fetching consumer transactions.");
            }
            // Get total sales grouped by date (total_sales per day)
            const totalAmountsQuery = `
                    SELECT DATE(transaction_date) AS date, SUM(total_cost) AS total_sales
                    FROM consumer_transactions
                    GROUP BY DATE(transaction_date)
                    ORDER BY DATE(transaction_date)`;
            con.query(totalAmountsQuery, (err, totalAmountsResults) => {
                if (err) {
                    console.error("Error fetching total amounts:", err);
                    return res.status(500).send("Error fetching total amounts data.");
                }

                // Map results into an array to send to the front-end
                const totalAmounts = totalAmountsResults.map(row => ({
                    date: row.date, // Transaction date
                    total_sales: row.total_sales // Total sales on that date
                }));

                // Render the page with all the required data
                res.render("pharmacypage/pharmacy", {
                    products: products,
                    consumer: consumer,
                    totalAmounts: totalAmounts // Pass total sales data to the view
                });
            });
        });
    });
});
app.get("/admin/doctorlogin", (req, res) => {
    res.render("doctorpage/doctor_login");
})
app.get("/appointmentbook", (req, res) => {
    var displayname = "SELECT * FROM patients p JOIN admit a ON p.patient_id=a.patient_id JOIN emergency e on e.patient_id=p.patient_id ";
    con.query(displayname, function (nameerror, nameresult) {
        if (nameerror) {
            console.log(nameerror);
        }
        else {
            var doctorname = `SELECT * FROM doctors`;
            con.query(doctorname, function (doctorerror, doctorresult) {
                if (doctorerror) {
                    console.log(doctorerror);
                }
                else {
                    var roomquery = `SELECT * FROM rooms WHERE is_occupied = 0`;
                    con.query(roomquery, function (roomerror, roomresult) {
                        if (roomerror) {
                            console.log(roomerror);
                        }
                        else {
                            res.render("appointmentbook", {
                                patients: nameresult,
                                message: req.flash('message'),
                                doctors: doctorresult,
                                rooms: roomresult
                            });
                        }
                    })
                }
            })
        }
    })
})
app.get('/doctor/visitnavigation', (req, res) => {
    res.render('doctorpage/visitnavigation');
})
app.get('/doctor/appointmentapprove', (req, res) => {
    if (!req.session.doctor_name) {
        console.log(req.session);
        console.log("return res.redirect('/admin/doctor_login_form/appointments');");
    }

    const query = `SELECT * FROM appointments WHERE status = 'Pending' AND doctor_name = ?`;
    con.query(query, [req.session.doctor_name], (err, results) => {
        if (err) {
            console.error("Error fetching appointments:", err);
            return res.status(500).send('Error fetching appointments');
        }

        // Format appointment_date for each appointment
        results.forEach((appointment) => {
            appointment.appointment_date = moment(appointment.appointment_date).format('ddd DD MMM YYYY');
        });

        res.render('doctorpage/appointmentapprove', { appointments: results });
        console.log(req.session.doctor_name);
    });
});
app.get("/doctoradmin", (req, res) => {
    console.log("Session Data:", req.session);
    if (!req.session.doctor_name) {
        return res.redirect("/admin/doctorlogin");
    }

    const doctor_name = req.session.doctor_name;

    const doctorQuery = `SELECT * FROM doctors WHERE doctor_name = ?`;
    con.query(doctorQuery, [doctor_name], (error, doctordetails) => {
        if (error) {
            throw error;
        }

        const doctor_id = doctordetails[0].doctor_id; // Extract doctor ID

        const patientQuery = `SELECT admit.*, patients.* 
                              FROM admit 
                              JOIN patients 
                              ON admit.patient_id = patients.patient_id 
                              WHERE doctor_assigned = ?`;

        con.query(patientQuery, [doctor_name], (error, patientdetails) => {
            if (error) {
                throw error;
            }

            const appointmentQuery = `
                SELECT * FROM appointments WHERE doctor_name = ? AND appointment_date = NOW();
            `;

            con.query(appointmentQuery, [doctor_name], (error, appointments) => {
                if (error) {
                    throw error;
                }

                // Query for the line chart data
                const chartQuery = `
                    SELECT DATE(admission_date) AS admit_date, COUNT(*) AS patient_count
                    FROM admit
                    WHERE doctor_assigned = ?
                    GROUP BY DATE(admission_date)
                    ORDER BY admit_date;
                `;

                con.query(chartQuery, [doctor_name], (error, chartData) => {
                    if (error) {
                        throw error;
                    }

                    // Query to fetch nurses assigned to the doctor
                    const nurseQuery = `
                        SELECT * FROM nurses WHERE doctor_id = ?;
                    `;

                    con.query(nurseQuery, [doctor_id], (error, nurses) => {
                        if (error) {
                            throw error;
                        }
                        const notificationquery = `SELECT * FROM notifications 
                            WHERE doctor_id = ? AND is_read = 0 
                            UNION 
                            SELECT * FROM notifications 
                            WHERE doctor_assigned = ? AND is_read = 0 
                            ORDER BY created_at DESC;`;
                        con.query(notificationquery, [doctor_id,doctor_name], (error, notifications) => {
                            if (error) {
                                throw error;
                            }
                            const labels = chartData.map(row => row.admit_date); // Dates
                            const data = chartData.map(row => row.patient_count); // Patient counts

                            // Render the doctoradmin view with all the data
                            res.render("doctorpage/doctoradmin", {
                                doctordetails: doctordetails[0],
                                patientdetails: patientdetails,
                                appointments: appointments,
                                nurses: nurses,
                                notifications: notifications,
                                chartLabels: JSON.stringify(labels),
                                chartData: JSON.stringify(data),
                            });
                        })
                        // Prepare data for the chart
                    });
                });
            });
        });
    });
});
app.get('/get-admitted-patients', (req, res) => {
    const query = `
        SELECT DATE(admission_date) AS date, COUNT(*) AS patient_count
        FROM admit
        GROUP BY DATE(admission_date)
        ORDER BY DATE(admission_date) ASC;
    `;

    con.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching admitted patients data:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(results); // Send the aggregated data as JSON
        }
    });
});
app.get('/admitted-vs-discharged', (req, res) => {
    const query = `
        SELECT 
            COUNT(CASE WHEN discharge_date IS NULL THEN 1 END) AS admitted,
            COUNT(CASE WHEN discharge_date IS NOT NULL THEN 1 END) AS discharged
        FROM admit
    `;

    con.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching patient data:', err);
            return res.status(500).send('Error fetching patient data');
        }

        res.json(results[0]); // Send the counts as JSON
    });
});
app.get("/admin/nurseallocate", (req, res) => {
    const query = `SELECT * FROM patients p JOIN admit a ON p.patient_id=a.patient_id WHERE nurse_id IS NULL AND discharge_date IS NULL`;
    con.query(query, (error, patients) => {
        if (error) {
            console.log(error);
        }
        else {
            res.render("nurseviews/nurseallocate", {
                patients: patients
            });
        }
    })
})
app.get("/nurse/allocation-form", (req, res) => {
    const admit_id = req.query.admit_id;
    const query = `SELECT * FROM nurses WHERE available=1`;
    con.query(query, (error, nurses) => {
        if (error) {
            console.log(error);
        }
        else {
            res.render("nurseviews/allocation-form",
                {
                    nurses: nurses,
                    admit_id: admit_id
                }
            );
        }
    })
})
app.get('/admin/visit-history', (req, res) => {
    const { ward_preference = '', sort = '', search = '' } = req.query; // Default values if no query parameters

    let query = `
        SELECT 
            CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
            r.room_number,
            r.ward_preference,
            b.badge_id,
            DATE_FORMAT(v.visit_time, '%Y-%m-%d %H:%i:%s') AS visit_time
        FROM visits v
        JOIN badge b ON v.badge_id = b.badge_id
        JOIN admit a ON v.visit_admit_id = a.admit_id
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN rooms r ON a.room_number = r.room_number AND a.ward_preference = r.ward_preference
        WHERE 1=1
    `;

    // Filtering by ward preference if provided
    if (ward_preference) query += ` AND r.ward_preference = '${ward_preference}'`;

    // Searching by patient name if search term is provided
    if (search) query += ` AND (p.first_name LIKE '%${search}%' OR p.last_name LIKE '%${search}%')`;

    // Sorting based on the sort parameter
    if (sort) {
        if (sort === "visit_time_asc") query += " ORDER BY v.visit_time ASC";
        if (sort === "visit_time_desc") query += " ORDER BY v.visit_time DESC";
    }

    con.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching visit history:', error);
            return res.status(500).send('Internal Server Error');
        }
        res.render('adminpage/visithistory', { visits: results, ward_preference, sort, search });
    });
});
app.get("/admin/visitqr", (req, res) => {
    res.render("adminpage/visitqr");
})
app.get("/patientlogin", (req, res) => {
    res.render("patientpage/patientlogin");
})
app.get('/patientdashboard', (req, res) => {
    if (!req.session.patientId) {
        return res.redirect('/patientlogin');
    }

    const sql = 'SELECT * FROM patients WHERE patient_id = ?';

    con.query(sql, [req.session.patientId], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            const patient = result[0];
            res.render('patientpage/patientdashboard', { patient });
        } else {
            res.send('Patient not found');
        }
    });
});
app.get('/admin/nurse', (req, res) => {
    res.render('adminpage/nurse');
})
app.get('/doctoradmin/diagnosis', (req, res) => {
    console.log("Session Data:", req.session);

    if (!req.session.doctor_name) {
        console.log("/admin/doctor_login_form");
        return res.redirect('/admin/doctor_login_form'); // Redirect if doctor not logged in
    }

    const doctor_name = req.session.doctor_name;

    // Fetch doctor_id from the doctors table
    const doctorQuery = `SELECT doctor_id FROM doctors WHERE doctor_name = ?`;

    con.query(doctorQuery, [doctor_name], (err, result) => {
        if (err || result.length === 0) {
            console.error("Error fetching doctor ID:", err);
            return res.status(500).send("Doctor not found.");
        }

        const doctor_id = result[0].doctor_id;

        // Query to get patient_id, patient_name, and patient_type
        const patientQuery = `
            SELECT patient_id, patient_name, patient_type FROM (
                -- Admitted patients
                SELECT DISTINCT p.patient_id AS patient_id, 
                                CONCAT(p.first_name, ' ', p.last_name) AS patient_name, 
                                'Admitted' AS patient_type
                FROM patients p
                JOIN admit a ON p.patient_id = a.patient_id
                WHERE a.doctor_assigned = ?

                UNION

                -- Appointment patients
                SELECT DISTINCT a.appointment_id AS patient_id, 
                                a.appointee_name AS patient_name, 
                                'Appointment' AS patient_type
                FROM appointments a
                WHERE a.doctor_name = ?
            ) AS combined_patients
            ORDER BY patient_name;
        `;

        con.query(patientQuery, [doctor_name, doctor_name], (err, patient) => {
            if (err) {
                console.error("Error fetching patients:", err);
                return res.status(500).send("Error fetching patient data.");
            }

            // Render the page with doctor_id and patients list
            res.render('doctorpage/diagnosis', { patient, doctor_id, doctor_name });
        });
    });
});
app.get('/doctoradmin/prescription', (req, res) => {
    const { diagnosis_id, patient_id, patient_type } = req.query;

    if (!diagnosis_id || (!patient_id && !appointment_id)) {
        return res.status(400).send("Missing diagnosis ID or patient/appointment ID");
    }

    let patientQuery = "";
    let queryParams = [];

    if (patient_type == 'admitted') {
        // Query for admitted patients
        patientQuery = `SELECT first_name, last_name FROM patients WHERE patient_id = ?`;
        queryParams = [patient_id];
    } else {
        // Query for appointment patients
        patientQuery = `SELECT appointee_name AS first_name FROM appointments WHERE appointment_id = ?`;
        queryParams = [patient_id];
    }

    con.query(patientQuery, queryParams, (err, patientResult) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching patient details");
        }

        if (patientResult.length === 0) {
            return res.status(404).send("Patient not found");
        }
        const medicineQuery = `SELECT medicine_id, medicine_name, manufacturer, batch_number, stock_quantity FROM medicine_products`;

        con.query(medicineQuery, (err, medicines) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error fetching medicines");
            }
            const patient = patientResult[0];

            res.render('doctorpage/prescription', {
                diagnosis_id,
                patient_type,
                patient_id: patient_id || null, // Pass null if not available
                patient,
                medicines
            });
        })

    });
})
app.get('/search-medicine', (req, res) => {
    let searchQuery = req.query.query;
    let sql = "SELECT medicine_id, medicine_name FROM medicine_products WHERE medicine_name LIKE ?";

    con.query(sql, [`%${searchQuery}%`], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json([]);
        }
        res.json(results);
    });
});
app.get('/doctoradmin/newprescription', (req, res) => {
    if (!req.session.doctor_name) {
        console.log("/admin/doctor_login_form");
        return res.redirect('/admin/doctor_login_form'); // Redirect if doctor not logged in
    }
    const doctor_name = req.session.doctor_name;
    const doctorQuery = `SELECT doctor_id FROM doctors WHERE doctor_name = ?`;

    con.query(doctorQuery, [doctor_name], (err, result) => {
        if (err || result.length === 0) {
            console.error("Error fetching doctor ID:", err);
            return res.status(500).send("Doctor not found.");
        }

        const doctor_id = result[0].doctor_id;
        const patientquery = `SELECT patient_id, patient_name, patient_type FROM (
                    -- Admitted patients
                    SELECT DISTINCT p.patient_id AS patient_id, 
                                    CONCAT(p.first_name, ' ', p.last_name) AS patient_name, 
                                    'Admitted' AS patient_type
                    FROM patients p
                    JOIN admit a ON p.patient_id = a.patient_id
                    WHERE a.doctor_assigned = ?
    
                    UNION
    
                    -- Appointment patients
                    SELECT DISTINCT a.appointment_id AS patient_id, 
                                    a.appointee_name AS patient_name, 
                                    'Appointment' AS patient_type
                    FROM appointments a
                    WHERE a.doctor_name = ?
                ) AS combined_patients
                ORDER BY patient_name;
            `;

        con.query(patientquery, [doctor_name, doctor_name], (error, patients) => {
            if (error) {
                console.log(error);
            }
            else {
                res.render('doctorpage/newprescription', { patients: patients, doctor_id });
            }
        })
    })
})
app.get('/chat', (req, res) => {
    res.render('chat');
});
app.get('/chat/setting', async (req, res) => {
    try {
        const user = await User.findById(req.session.currentUser._id).select("name email profilePicture");
        if (!user) {
            return res.status(404).send("User not found");
        }

        res.render('chatpage/chatsetting', { user });
    } catch (error) {
        res.status(500).send("Error loading settings page");
    }
});
app.get('/video-chat', (req, res) => {
    console.log("session data",req.session);
    res.render('videocall',{session:req.session});
});








app.post("/admin_login_form", adminloginroute);
app.post("/new_patient", patientroute);
app.post("/admit_patient", admitroute);
app.post("/discharge_patient", dischargeroute);
app.post("/search_badges", visitroute);
app.post("/assign_badge", visitroute);
app.post("/new_doctor", newdoctorroute);
app.post("/add_equipment", neweqroute);
app.post("/update_equipment", updateeqroute);
app.post("/add_staff", newstaffroute);
app.post("/doctor_login_form", doctorloginroute);
app.post("/new_appointment", appointmentroute);
app.post('/doctor/approve_appointment', (req, res) => {
    const { appointment_id } = req.body;
    // Step 1: Update the appointment status to 'Scheduled'
    const updateQuery = `UPDATE appointments SET status = 'Scheduled' WHERE appointment_id = ?`;

    con.query(updateQuery, [appointment_id], (updateErr, updateResult) => {
        if (updateErr) {
            console.error("Error approving appointment:", updateErr);
            return res.status(500).send('Error approving appointment');
        }

        // Step 2: Retrieve patient details for the approved appointment
        const selectQuery = `SELECT appointee_name, appointee_email, doctor_name, appointment_date, appointment_time FROM appointments WHERE appointment_id = ?`;

        con.query(selectQuery, [appointment_id], (selectErr, results) => {
            if (selectErr) {
                console.error("Error retrieving appointment details:", selectErr);
                return res.status(500).send('Error retrieving appointment details');
            }

            if (results.length === 0) {
                return res.status(404).send('Appointment not found');
            }

            // Step 3: Prepare the email
            const { appointee_name, appointee_email, doctor_name, appointment_date, appointment_time } = results[0];

            // Format the appointment date and time
            const date = new Date(appointment_date);
            const formattedDate = `${date.toDateString()} at ${appointment_time}`;

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'chauhanrudresh2005@gmail.com',
                    pass: 'kemn rqkk hebi wzoc',
                },
            });

            const mailOptions = {
                from: 'chauhanrudresh2005@gmail.com', // Replace with your email
                to: appointee_email,
                subject: 'Appointment Scheduled',
                text: `Dear ${appointee_name},\n\nYour appointment with Dr. ${doctor_name} has been scheduled for ${formattedDate}.\n\nBest regards,\nHospital Management`,
            };

            // Step 4: Send the email
            transporter.sendMail(mailOptions, (mailErr, info) => {
                if (mailErr) {
                    console.error("Error sending email:", mailErr);
                    return res.status(500).send('Error sending email');
                }
                res.redirect('/doctor/appointmentapprove');
            });
        });
    });
});
app.post('/doctor/reject_appointment', (req, res) => {
    const { appointment_id } = req.body;
    const query = `UPDATE appointments SET status = 'Cancelled' WHERE appointment_id = ?`;
    con.query(query, [appointment_id], (err, result) => {
        if (err) {
            console.error("Error rejecting appointment:", err);
            return res.status(500).send('Error rejecting appointment');
        }
        res.redirect('/doctor/appointmentapprove');
    });
});
app.post("/admin/allocatenurse", (req, res) => {
    const { admit_id, nurseid } = req.body;
    const updateAdmitQuery = `UPDATE admit SET nurse_id = ? WHERE admit_id = ?`;
    const updateNurseQuery = `UPDATE nurses SET available = 0 WHERE nurse_id = ?`;

    con.query(updateAdmitQuery, [nurseid, admit_id], (admitErr, admitResult) => {
        if (admitErr) {
            console.error("Error updating admit table:", admitErr);
            return res.status(500).send("Internal Server Error");
        }

        // Then update the nurses table
        con.query(updateNurseQuery, [nurseid], (nurseErr, nurseResult) => {
            if (nurseErr) {
                console.error("Error updating nurse availability:", nurseErr);
                return res.status(500).send("Internal Server Error");
            }
            req.session.flashMessage = "Nurse allocated successfully!";
            res.redirect("/admin/nurseallocate");
        });
    });
});
app.post('/api/decode-qr', visitqrroute);
app.post('/patientlogin', patientloginroute);
app.post('/new_nurse', nurseroute);
app.post('/diagnosis', diagnosisroute);
app.post('/prescription', prescriptionroute);
app.post('/newprescription', newprescriptionroute);
app.post('/notifications/mark-as-read',(req,res)=>{
    const {notification_id}=req.body;
    const query = `UPDATE notifications SET is_read = 1 WHERE notification_id = ?`;
    con.query(query, [notification_id], (err, result) => {
        if (err) {
            console.error("Error marking notification:", err);
            return res.status(500).send('Error marking notification');
        }
        res.redirect('/doctoradmin');
    });
})

server.listen(3000, () => {
    console.log(`Server running on port 3000`);
});