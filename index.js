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
const { v4: uuidv4 } = require('uuid');

const server = http.createServer(app);
const io = socketio(server);

app.use(express.json());

const User = require('./models/userModel.js');
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
const authApiRoute = require('./routes/api/authroute');
app.use('/uploads', express.static(path.join(__dirname, 'routes', 'chat', 'uploads')));

app.use('/profile-pictures', express.static(path.join(__dirname, 'routes/chat/uploads/Profile-pictures')));


app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Explicit route for video to ensure correct serving
app.get("/background.mp4", (req, res) => {
    const videoPath = path.join(__dirname, 'public/react-home', 'background.mp4');
    res.setHeader('Content-Type', 'video/mp4');
    res.sendFile(videoPath, (err) => {
        if (err) {
            console.error("Error sending video:", err);
            res.status(404).end();
        }
    });
});

app.use(express.static(path.join(__dirname, 'public/react-home'))); // Serve React assets
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

app.use('/api/auth', authApiRoute);

app.get('/api/admin/patients/overview', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const patientQuery = 'SELECT * FROM patients p JOIN admit a ON p.patient_id = a.patient_id JOIN emergency e ON e.patient_id = p.patient_id';
    con.query(patientQuery, (patientError, patients) => {
        if (patientError) {
            console.error('Error loading patients overview:', patientError);
            return res.status(500).json({ message: 'Failed to load patient overview' });
        }

        const doctorQuery = 'SELECT * FROM doctors';
        con.query(doctorQuery, (doctorError, doctors) => {
            if (doctorError) {
                console.error('Error loading doctors:', doctorError);
                return res.status(500).json({ message: 'Failed to load doctors' });
            }

            const roomQuery = 'SELECT * FROM rooms WHERE is_occupied = 0';
            con.query(roomQuery, (roomError, rooms) => {
                if (roomError) {
                    console.error('Error loading rooms:', roomError);
                    return res.status(500).json({ message: 'Failed to load rooms' });
                }

                return res.status(200).json({
                    patients,
                    doctors,
                    rooms,
                    message: req.flash('message'),
                });
            });
        });
    });
});

app.get('/api/admin/admit/overview', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const patientQuery = `SELECT p.patient_id, p.first_name, p.last_name, MAX(a.discharge_date) AS discharge_date
        FROM patients p
        JOIN admit a ON p.patient_id = a.patient_id
        WHERE a.discharge_date IS NOT NULL
        GROUP BY p.patient_id, p.first_name, p.last_name;`;

    con.query(patientQuery, (patientError, patients) => {
        if (patientError) {
            console.error('Error loading admit patients overview:', patientError);
            return res.status(500).json({ message: 'Failed to load admit patients' });
        }

        const doctorQuery = 'SELECT * FROM doctors';
        con.query(doctorQuery, (doctorError, doctors) => {
            if (doctorError) {
                console.error('Error loading doctors:', doctorError);
                return res.status(500).json({ message: 'Failed to load doctors' });
            }

            const roomQuery = 'SELECT * FROM rooms WHERE is_occupied = 0';
            con.query(roomQuery, (roomError, rooms) => {
                if (roomError) {
                    console.error('Error loading rooms:', roomError);
                    return res.status(500).json({ message: 'Failed to load rooms' });
                }

                return res.status(200).json({
                    patients,
                    doctors,
                    rooms,
                    message: req.flash('message'),
                });
            });
        });
    });
});

app.get('/api/admin/discharge/overview', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const activePatientsQuery = `SELECT 
            patients.patient_id,
            patients.first_name,
            patients.last_name,
            admit.doctor_assigned,
            admit.admit_id,
            admit.room_number
        FROM patients
        INNER JOIN admit ON patients.patient_id = admit.patient_id
        WHERE admit.discharge_date IS NULL`;

    con.query(activePatientsQuery, (error, patients) => {
        if (error) {
            console.error('Error loading discharge overview:', error);
            return res.status(500).json({ message: 'Failed to load discharge overview' });
        }

        return res.status(200).json({
            patients,
            message: req.flash('message'),
        });
    });
});

app.post('/api/admin/discharge', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const { first_name, last_name, reason_for_admission } = req.body;
    if (!first_name || !last_name || !reason_for_admission) {
        return res.status(400).json({ message: 'first_name, last_name, and reason_for_admission are required' });
    }

    const patientIdQuery = 'SELECT patient_id FROM patients WHERE first_name = ? AND last_name = ? LIMIT 1';
    con.query(patientIdQuery, [first_name, last_name], (patientError, patientResult) => {
        if (patientError) {
            console.error('Error fetching patient details for discharge:', patientError);
            return res.status(500).json({ message: 'Error fetching patient details.' });
        }

        if (!patientResult.length) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const patient_id = patientResult[0].patient_id;
        const activeAdmitQuery = `SELECT doctor_assigned, room_number, admit_id
            FROM admit
            WHERE patient_id = ? AND discharge_date IS NULL
            LIMIT 1`;

        con.query(activeAdmitQuery, [patient_id], (admitError, admitResult) => {
            if (admitError) {
                console.error('Error checking active admission:', admitError);
                return res.status(500).json({ message: 'Error checking recovery status.' });
            }

            if (!admitResult.length) {
                return res.status(400).json({ message: 'Patient is not admitted or already discharged.' });
            }

            const { room_number, admit_id, doctor_assigned } = admitResult[0];
            const dischargeQuery = `
                UPDATE admit
                SET discharge_date = NOW(), reason_for_admission = ?
                WHERE admit_id = ?
            `;

            con.query(dischargeQuery, [reason_for_admission, admit_id], (dischargeError) => {
                if (dischargeError) {
                    console.error('Error discharging patient:', dischargeError);
                    return res.status(500).json({ message: 'Error discharging patient.' });
                }

                const roomUpdateQuery = 'UPDATE rooms SET is_occupied = 0 WHERE room_number = ?';
                con.query(roomUpdateQuery, [room_number], (roomError) => {
                    if (roomError) {
                        console.error('Error updating room status:', roomError);
                        return res.status(500).json({ message: 'Error updating room status.' });
                    }

                    const notificationQuery = `
                        INSERT INTO notifications (doctor_assigned, patient_id, type, message, is_read, created_at)
                        VALUES (?, ?, ?, ?, ?, NOW())
                    `;

                    con.query(
                        notificationQuery,
                        [doctor_assigned, patient_id, 'Patient Discharge Update', `Patient ${first_name} ${last_name} has been discharged.`, 0],
                        (notificationError) => {
                            if (notificationError) {
                                console.error('Doctor Notification Error:', notificationError);
                                return res.status(500).json({ message: 'Error notifying doctor.' });
                            }

                            return res.status(200).json({
                                message: `Patient ${first_name} ${last_name} discharged successfully, and room ${room_number} is now available.`,
                                room_number,
                            });
                        }
                    );
                });
            });
        });
    });
});

app.get('/api/admin/patienthistory', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const { gender, ward_preference, sort } = req.query;
    let query = `
        SELECT * FROM patients p
        JOIN admit a ON p.patient_id = a.patient_id
        JOIN emergency e ON e.patient_id = a.patient_id
        WHERE 1=1
    `;
    const params = [];

    if (gender) {
        query += ' AND p.gender = ?';
        params.push(gender);
    }
    if (ward_preference) {
        query += ' AND a.ward_preference = ?';
        params.push(ward_preference);
    }

    const sortMapping = {
        admission_date_asc: ' ORDER BY a.admission_date ASC',
        admission_date_desc: ' ORDER BY a.admission_date DESC',
        discharge_date_asc: ' ORDER BY a.discharge_date ASC',
        discharge_date_desc: ' ORDER BY a.discharge_date DESC',
    };
    if (sort && sortMapping[sort]) {
        query += sortMapping[sort];
    }

    con.query(query, params, (error, patientdetails) => {
        if (error) {
            console.error('Error loading patient history:', error);
            return res.status(500).json({ message: 'Failed to load patient history' });
        }

        return res.status(200).json({
            patientdetails,
            filters: {
                gender: gender || '',
                ward_preference: ward_preference || '',
                sort: sort || '',
            },
        });
    });
});

app.get('/api/admin/newvisitor/overview', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const displayPatientsQuery = `
        SELECT admit.admit_id, patients.patient_id, patients.first_name, patients.last_name
        FROM patients
        INNER JOIN admit ON patients.patient_id = admit.patient_id
        WHERE admit.discharge_date IS NULL
    `;

    con.query(displayPatientsQuery, (error, patients) => {
        if (error) {
            console.error('Error fetching active patients for visitor flow:', error);
            return res.status(500).json({ message: 'Error fetching active patients.' });
        }

        return res.status(200).json({
            patients,
            badges: null,
            admit_id: null,
            message: req.flash('message'),
        });
    });
});

app.post('/api/admin/newvisitor/search-badges', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const { first_name, last_name } = req.body;
    if (!first_name || !last_name) {
        return res.status(400).json({ message: 'first_name and last_name are required' });
    }

    const patientQuery = `
        SELECT patient_id
        FROM patients
        WHERE first_name = ? AND last_name = ?
        LIMIT 1
    `;

    con.query(patientQuery, [first_name, last_name], (patientError, patientResult) => {
        if (patientError) {
            console.error('Error fetching patient_id for visitor flow:', patientError);
            return res.status(500).json({ message: 'Error fetching patient information.' });
        }

        if (!patientResult.length) {
            return res.status(404).json({ message: 'No patient found with the given name.' });
        }

        const patient_id = patientResult[0].patient_id;
        const admitQuery = `
            SELECT admit_id
            FROM admit
            WHERE patient_id = ? AND discharge_date IS NULL
            LIMIT 1
        `;

        con.query(admitQuery, [patient_id], (admitError, admitResult) => {
            if (admitError) {
                console.error('Error fetching admit_id for visitor flow:', admitError);
                return res.status(500).json({ message: 'Error fetching admission information.' });
            }

            if (!admitResult.length) {
                return res.status(404).json({ message: 'No active admission found for this patient.' });
            }

            const admit_id = admitResult[0].admit_id;
            const badgeQuery = `
                SELECT badge_id
                FROM badge
                WHERE admit_id = ?
            `;

            con.query(badgeQuery, [admit_id], (badgeError, badgeResult) => {
                if (badgeError) {
                    console.error('Error fetching badge_id for visitor flow:', badgeError);
                    return res.status(500).json({ message: 'Error fetching badge information.' });
                }

                if (!badgeResult.length) {
                    return res.status(404).json({ message: 'No badges available for this admission.' });
                }

                return res.status(200).json({
                    admit_id,
                    badges: badgeResult,
                    message: 'Badges loaded successfully.',
                });
            });
        });
    });
});

app.post('/api/admin/newvisitor/assign-badge', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const { badge_id, admit_id } = req.body;
    if (!badge_id || !admit_id) {
        return res.status(400).json({ message: 'badge_id and admit_id are required' });
    }

    const visitQuery = `
        INSERT INTO visits (badge_id, visit_time, visit_admit_id)
        VALUES (?, NOW(), ?)
    `;

    con.query(visitQuery, [badge_id, admit_id], (error) => {
        if (error) {
            console.error('Error inserting visit:', error);
            return res.status(500).json({ message: 'Error recording visit.' });
        }

        return res.status(200).json({ message: 'Visit recorded successfully.' });
    });
});

app.get('/api/admin/visit-history', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const { ward_preference = '', sort = '', search = '' } = req.query;
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
    const params = [];

    if (ward_preference) {
        query += ' AND r.ward_preference = ?';
        params.push(ward_preference);
    }

    if (search) {
        query += ' AND (p.first_name LIKE ? OR p.last_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (sort === 'visit_time_asc') query += ' ORDER BY v.visit_time ASC';
    if (sort === 'visit_time_desc') query += ' ORDER BY v.visit_time DESC';

    con.query(query, params, (error, visits) => {
        if (error) {
            console.error('Error fetching visit history:', error);
            return res.status(500).json({ message: 'Failed to load visit history' });
        }

        return res.status(200).json({
            visits,
            filters: { ward_preference, sort, search },
        });
    });
});

app.get('/api/admin/newdoctor/overview', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    return res.status(200).json({ message: req.flash('message') });
});

app.post('/api/admin/newdoctor', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const { doctor_name, speciality, doctor_in, doctor_out, doctor_password } = req.body;
    if (!doctor_name || !speciality || !doctor_in || !doctor_out || !doctor_password) {
        return res.status(400).json({ message: 'All doctor fields are required' });
    }

    const insertDoctorQuery = `
        INSERT INTO doctors (doctor_name, speciality, doctor_in, doctor_out, doctor_password)
        VALUE (?, ?, ?, ?, ?)
    `;

    con.query(insertDoctorQuery, [doctor_name, speciality, doctor_in, doctor_out, doctor_password], (error) => {
        if (error) {
            console.error('Error adding doctor:', error);
            return res.status(500).json({ message: 'Failed to add doctor' });
        }

        return res.status(200).json({ message: 'Doctor added successfully.' });
    });
});

app.post('/api/admin/newstaff', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const {
        staff_first_name,
        staff_last_name,
        role,
        department,
        contact_number,
        email,
        hire_date,
        address,
        shift,
    } = req.body;

    if (!staff_first_name || !staff_last_name || !role) {
        return res.status(400).json({ message: 'Staff first name, last name and role are required' });
    }

    const insertStaffQuery = `
        INSERT INTO hospital_staff
            (staff_first_name, staff_last_name, role, department, contact_number, email, hire_date, address, shift)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        staff_first_name,
        staff_last_name,
        role,
        department || null,
        contact_number || null,
        email || null,
        hire_date || null,
        address || null,
        shift || null,
    ];

    con.query(insertStaffQuery, values, (error) => {
        if (error) {
            console.error('Error adding staff member:', error);
            return res.status(500).json({ message: 'Failed to add staff member' });
        }

        return res.status(200).json({ message: 'New staff member added successfully.' });
    });
});

app.get('/api/admin/equipment/overview', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const equipmentQuery = 'SELECT * FROM equipments';
    con.query(equipmentQuery, (error, equipments) => {
        if (error) {
            console.error('Error loading equipments:', error);
            return res.status(500).json({ message: 'Failed to load equipments' });
        }

        return res.status(200).json({
            equipments,
            message: req.flash('message'),
        });
    });
});

app.post('/api/admin/equipment/add', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const { equipment_name, count } = req.body;
    if (!equipment_name || !count) {
        return res.status(400).json({ message: 'equipment_name and count are required' });
    }

    const insertEquipmentQuery = 'INSERT INTO equipments (equipment_name, count) VALUE (?, ?)';
    con.query(insertEquipmentQuery, [equipment_name, count], (error) => {
        if (error) {
            console.error('Error adding equipment:', error);
            return res.status(500).json({ message: 'Failed to add equipment' });
        }

        return res.status(200).json({ message: 'Equipment added successfully.' });
    });
});

app.post('/api/admin/equipment/update', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const { equipment_name, count } = req.body;
    if (!equipment_name || !count) {
        return res.status(400).json({ message: 'equipment_name and count are required' });
    }

    const updateEquipmentQuery = 'UPDATE equipments SET count = ? WHERE equipment_name = ?';
    con.query(updateEquipmentQuery, [count, equipment_name], (error) => {
        if (error) {
            console.error('Error updating equipment:', error);
            return res.status(500).json({ message: 'Failed to update equipment' });
        }

        return res.status(200).json({ message: 'Equipment updated successfully.' });
    });
});

app.get('/api/doctor/visitnavigation', (req, res) => {
    if (!req.session.doctor_name) {
        return res.status(401).json({ message: 'Doctor authentication required' });
    }

    return res.status(200).json({
        doctor_name: req.session.doctor_name,
        links: {
            appointmentApprove: '/migrate/doctor/appointmentapprove',
            visits: '/migrate/doctor/dashboard',
        },
    });
});

app.get('/api/doctor/appointments/pending', (req, res) => {
    if (!req.session.doctor_name) {
        return res.status(401).json({ message: 'Doctor authentication required' });
    }

    const query = `SELECT * FROM appointments WHERE status = 'Pending' AND doctor_name = ?`;
    con.query(query, [req.session.doctor_name], (err, results) => {
        if (err) {
            console.error('Error fetching pending appointments:', err);
            return res.status(500).json({ message: 'Error fetching appointments' });
        }

        const appointments = (results || []).map((appointment) => ({
            ...appointment,
            appointment_date: moment(appointment.appointment_date).format('ddd DD MMM YYYY'),
        }));

        return res.status(200).json({ appointments });
    });
});

app.post('/api/doctor/appointments/approve', (req, res) => {
    if (!req.session.doctor_name) {
        return res.status(401).json({ message: 'Doctor authentication required' });
    }

    const { appointment_id } = req.body;
    if (!appointment_id) {
        return res.status(400).json({ message: 'appointment_id is required' });
    }

    const updateQuery = `UPDATE appointments SET status = 'Scheduled' WHERE appointment_id = ?`;
    con.query(updateQuery, [appointment_id], (updateErr) => {
        if (updateErr) {
            console.error('Error approving appointment:', updateErr);
            return res.status(500).json({ message: 'Error approving appointment' });
        }

        const selectQuery = `SELECT appointee_name, appointee_email, doctor_name, appointment_date, appointment_time FROM appointments WHERE appointment_id = ?`;
        con.query(selectQuery, [appointment_id], (selectErr, results) => {
            if (selectErr) {
                console.error('Error retrieving appointment details:', selectErr);
                return res.status(500).json({ message: 'Error retrieving appointment details' });
            }

            if (!results.length) {
                return res.status(404).json({ message: 'Appointment not found' });
            }

            const { appointee_name, appointee_email, doctor_name, appointment_date, appointment_time } = results[0];
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
                from: 'chauhanrudresh2005@gmail.com',
                to: appointee_email,
                subject: 'Appointment Scheduled',
                text: `Dear ${appointee_name},\n\nYour appointment with Dr. ${doctor_name} has been scheduled for ${formattedDate}.\n\nBest regards,\nHospital Management`,
            };

            transporter.sendMail(mailOptions, (mailErr) => {
                if (mailErr) {
                    console.error('Error sending email:', mailErr);
                    return res.status(500).json({ message: 'Error sending email' });
                }

                return res.status(200).json({ message: 'Appointment approved and email sent.' });
            });
        });
    });
});

app.post('/api/doctor/appointments/reject', (req, res) => {
    if (!req.session.doctor_name) {
        return res.status(401).json({ message: 'Doctor authentication required' });
    }

    const { appointment_id } = req.body;
    if (!appointment_id) {
        return res.status(400).json({ message: 'appointment_id is required' });
    }

    const query = `UPDATE appointments SET status = 'Cancelled' WHERE appointment_id = ?`;
    con.query(query, [appointment_id], (err) => {
        if (err) {
            console.error('Error rejecting appointment:', err);
            return res.status(500).json({ message: 'Error rejecting appointment' });
        }

        return res.status(200).json({ message: 'Appointment rejected.' });
    });
});

app.get('/api/doctor/dashboard/overview', (req, res) => {
    if (!req.session.doctor_name) {
        return res.status(401).json({ message: 'Doctor authentication required' });
    }

    const doctor_name = req.session.doctor_name;
    const doctorQuery = `SELECT * FROM doctors WHERE doctor_name = ?`;
    con.query(doctorQuery, [doctor_name], (doctorError, doctordetails) => {
        if (doctorError || !doctordetails?.length) {
            console.error('Error loading doctor details:', doctorError);
            return res.status(500).json({ message: 'Failed to load doctor details' });
        }

        const doctor_id = doctordetails[0].doctor_id;
        const patientQuery = `SELECT admit.*, patients.*
            FROM admit
            JOIN patients ON admit.patient_id = patients.patient_id
            WHERE doctor_assigned = ?`;

        con.query(patientQuery, [doctor_name], (patientError, patientdetails) => {
            if (patientError) {
                console.error('Error loading patient details:', patientError);
                return res.status(500).json({ message: 'Failed to load patient details' });
            }

            const appointmentQuery = `SELECT * FROM appointments WHERE doctor_name = ? AND appointment_date = NOW()`;
            con.query(appointmentQuery, [doctor_name], (appointmentError, appointments) => {
                if (appointmentError) {
                    console.error('Error loading appointments:', appointmentError);
                    return res.status(500).json({ message: 'Failed to load appointments' });
                }

                const chartQuery = `
                    SELECT DATE(admission_date) AS admit_date, COUNT(*) AS patient_count
                    FROM admit
                    WHERE doctor_assigned = ?
                    GROUP BY DATE(admission_date)
                    ORDER BY admit_date;
                `;
                con.query(chartQuery, [doctor_name], (chartError, chartData) => {
                    if (chartError) {
                        console.error('Error loading chart data:', chartError);
                        return res.status(500).json({ message: 'Failed to load chart data' });
                    }

                    const nurseQuery = `SELECT * FROM nurses WHERE doctor_id = ?;`;
                    con.query(nurseQuery, [doctor_id], (nurseError, nurses) => {
                        if (nurseError) {
                            console.error('Error loading nurses:', nurseError);
                            return res.status(500).json({ message: 'Failed to load nurses' });
                        }

                        const notificationQuery = `
                            SELECT * FROM notifications
                            WHERE doctor_id = ? AND is_read = 0
                            UNION
                            SELECT * FROM notifications
                            WHERE doctor_assigned = ? AND is_read = 0
                            ORDER BY created_at DESC;
                        `;

                        con.query(notificationQuery, [doctor_id, doctor_name], (notificationError, notifications) => {
                            if (notificationError) {
                                console.error('Error loading notifications:', notificationError);
                                return res.status(500).json({ message: 'Failed to load notifications' });
                            }

                            return res.status(200).json({
                                doctordetails: doctordetails[0],
                                patientdetails,
                                appointments,
                                nurses,
                                notifications,
                                chartLabels: chartData.map((row) => row.admit_date),
                                chartData: chartData.map((row) => row.patient_count),
                            });
                        });
                    });
                });
            });
        });
    });
});

app.get('/api/patient/dashboard/overview', (req, res) => {
    if (!req.session.patientId) {
        return res.status(401).json({ message: 'Patient authentication required' });
    }

    const patientQuery = 'SELECT * FROM patients WHERE patient_id = ?';
    con.query(patientQuery, [req.session.patientId], (patientError, patientResult) => {
        if (patientError || !patientResult?.length) {
            console.error('Error loading patient details:', patientError);
            return res.status(500).json({ message: 'Failed to load patient details' });
        }

        const patient = patientResult[0];
        const notificationQuery = 'SELECT * FROM notifications WHERE patient_id = ?';
        con.query(notificationQuery, [req.session.patientId], (notificationError, notifications) => {
            if (notificationError) {
                console.error('Error loading patient notifications:', notificationError);
                return res.status(500).json({ message: 'Failed to load notifications' });
            }

            const prescriptionQuery = `
                SELECT p.*, pm.*
                FROM prescriptions p
                JOIN prescription_medicines pm
                WHERE p.patient_id = ? AND p.prescription_id = pm.prescription_id
            `;

            con.query(prescriptionQuery, [req.session.patientId], (prescriptionError, prescriptions) => {
                if (prescriptionError) {
                    console.error('Error loading prescriptions:', prescriptionError);
                    return res.status(500).json({ message: 'Failed to load prescriptions' });
                }

                return res.status(200).json({
                    patient,
                    notifications: notifications || [],
                    prescriptions: prescriptions || [],
                });
            });
        });
    });
});

app.get('/api/admin/pharmacy/overview', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const productQuery = 'SELECT * FROM medicine_products';
    con.query(productQuery, (productError, products) => {
        if (productError) {
            console.error('Error fetching pharmacy products:', productError);
            return res.status(500).json({ message: 'Error fetching products.' });
        }

        const consumerQuery = 'SELECT * FROM consumer_transactions';
        con.query(consumerQuery, (consumerError, consumer) => {
            if (consumerError) {
                console.error('Error fetching consumer transactions:', consumerError);
                return res.status(500).json({ message: 'Error fetching consumer transactions.' });
            }

            const totalAmountsQuery = `
                SELECT DATE(transaction_date) AS date, SUM(total_cost) AS total_sales
                FROM consumer_transactions
                GROUP BY DATE(transaction_date)
                ORDER BY DATE(transaction_date)
            `;

            con.query(totalAmountsQuery, (amountError, totalAmountsResults) => {
                if (amountError) {
                    console.error('Error fetching total sales amounts:', amountError);
                    return res.status(500).json({ message: 'Error fetching total amounts data.' });
                }

                const totalAmounts = (totalAmountsResults || []).map((row) => ({
                    date: row.date,
                    total_sales: row.total_sales,
                }));

                return res.status(200).json({
                    products: products || [],
                    consumer: consumer || [],
                    totalAmounts,
                });
            });
        });
    });
});

app.get('/api/admin/nurseallocate/overview', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const query = `
        SELECT * FROM patients p
        JOIN admit a ON p.patient_id = a.patient_id
        WHERE nurse_id IS NULL AND discharge_date IS NULL
    `;
    con.query(query, (error, patients) => {
        if (error) {
            console.error('Error fetching nurse allocation patients:', error);
            return res.status(500).json({ message: 'Failed to load patients requiring nurse allocation' });
        }

        return res.status(200).json({
            patients: patients || [],
            flashMessage: req.session.flashMessage || null,
        });
    });
});

app.get('/api/admin/nurseallocate/nurses', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const { admit_id } = req.query;
    if (!admit_id) {
        return res.status(400).json({ message: 'admit_id is required' });
    }

    const query = 'SELECT * FROM nurses WHERE available = 1';
    con.query(query, (error, nurses) => {
        if (error) {
            console.error('Error fetching available nurses:', error);
            return res.status(500).json({ message: 'Failed to load available nurses' });
        }

        return res.status(200).json({ nurses: nurses || [], admit_id });
    });
});

app.post('/api/admin/nurseallocate/assign', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const { admit_id, nurseid } = req.body;
    if (!admit_id || !nurseid) {
        return res.status(400).json({ message: 'admit_id and nurseid are required' });
    }

    const updateAdmitQuery = 'UPDATE admit SET nurse_id = ? WHERE admit_id = ?';
    const updateNurseQuery = 'UPDATE nurses SET available = 0 WHERE nurse_id = ?';

    con.query(updateAdmitQuery, [nurseid, admit_id], (admitErr) => {
        if (admitErr) {
            console.error('Error updating admit table:', admitErr);
            return res.status(500).json({ message: 'Failed to allocate nurse' });
        }

        con.query(updateNurseQuery, [nurseid], (nurseErr) => {
            if (nurseErr) {
                console.error('Error updating nurse availability:', nurseErr);
                return res.status(500).json({ message: 'Failed to update nurse availability' });
            }

            req.session.flashMessage = 'Nurse allocated successfully!';
            return res.status(200).json({ message: 'Nurse allocated successfully!' });
        });
    });
});

app.get('/api/admin/ai/overview', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }

    const admin_id = req.session.admin_id;
    const query = 'SELECT * FROM chat_session WHERE admin_id = ? ORDER BY created_at DESC';
    con.query(query, [admin_id], (err, sessions) => {
        if (err) {
            console.error('Error fetching admin AI sessions:', err);
            return res.status(500).json({ message: 'Error fetching sessions' });
        }

        if (!sessions.length) {
            return res.status(200).json({
                admin_id,
                sessions: [],
                initialSessionId: null,
                initialChatHistory: [],
            });
        }

        const initialSessionId = sessions[0].session_uuid;
        const chatQuery = 'SELECT * FROM chat_history WHERE session_uuid = ? ORDER BY timestamp ASC';
        con.query(chatQuery, [initialSessionId], (chatErr, chatHistory) => {
            if (chatErr) {
                console.error('Error fetching initial admin AI chat history:', chatErr);
                return res.status(500).json({ message: 'Error fetching chat history' });
            }

            return res.status(200).json({
                admin_id,
                sessions,
                initialSessionId,
                initialChatHistory: chatHistory || [],
            });
        });
    });
});

const chatRoutes = require('./routes/chat/chatroute');
app.use('/chat', chatRoutes);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/react-home', 'index.html'));
})

app.get('/migrate/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/react-home', 'index.html'));
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
    var displayname = `SELECT 
            patients.patient_id, 
            patients.first_name, 
            patients.last_name, 
            admit.doctor_assigned 
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
                        con.query(notificationquery, [doctor_id, doctor_name], (error, notifications) => {
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
        const patient = result[0];
        var notificationquery = `SELECT * FROM notifications where patient_id = ?`;

        con.query(notificationquery, [req.session.patientId], (err, notifications) => {
            if (err) throw err;
            else {
                var prescriptionquery = `SELECT p.* , pm.* FROM prescriptions p JOIN prescription_medicines pm WHERE p.patient_id = ? AND p.prescription_id = pm.prescription_id`;
                con.query(prescriptionquery, [req.session.patientId], (err, prescriptions) => {
                    if (err) throw err;
                    else {
                        res.render('patientpage/patientdashboard', { patient, notifications, prescriptions });
                    }
                })
            }
        })
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
    console.log("session data", req.session);
    res.render('videocall', { session: req.session });
});
app.get('/admin/ai', (req, res) => {
    if (!req.session.admin_id) {
        return res.redirect('/adminlogin')
    }
    const admin_id = req.session.admin_id;
    const query = 'SELECT * FROM chat_session WHERE admin_id = ? ORDER BY created_at DESC';
    con.query(query, [admin_id], (err, sessions) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error fetching admin details");
        }
        else {
            let initialsession_uuid = null;
            let initialchathistory = [];
            if (sessions.length > 0) {
                initialsession_uuid = sessions[0].session_uuid;
                const chatquery = `SELECT * FROM chat_history where session_uuid = ? ORDER BY timestamp ASC`;
                con.query(chatquery, [initialsession_uuid], (err, chat_history) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send("Error fetching chat history");
                    }
                    else {
                        res.render('adminpage/adminai', {
                            admin_id: admin_id,
                            sessions: sessions,
                            chatHistory: chat_history,
                            initialSessionId: initialsession_uuid,
                            initialChatHistory: chat_history
                        });
                    }
                })
            }
            else {
                res.render('adminpage/adminai', {
                    admin_id: admin_id,
                    sessions: [],
                    chatHistory: [],
                    initialSessionId: null,
                    initialChatHistory: []
                })
            }
        }
    })
})
app.get('/admin/ai/chat/:session_uuid', (req, res) => {
    if (!req.session.admin_id) {
        return res.status(401).json({ "error": "Unauthorized access. Please log in." });
    }
    const admin_id = req.session.admin_id;
    const session_uuid = req.params.session_uuid;

    const sessionquery = "SELECT * FROM chat_session WHERE admin_id = ? AND session_uuid = ?";
    con.query(sessionquery, [admin_id, session_uuid], (err, sessions) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ "error": "Error fetching session details" });
        }
        if (sessions.length === 0) {
            return res.status(404).json({ "error": "Session not found" });
        }
        const chatquery = `SELECT * FROM chat_history WHERE session_uuid = ? ORDER BY timestamp ASC`;
        con.query(chatquery, [session_uuid], (err, chat_history) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ "error": "Error fetching chat history" });
            }
            res.json({ chat_history: chat_history, session: sessions[0] });
        });
    });
})
app.get('/patient/ai', (req, res) => {
    if (!req.session.patientId) {
        return res.redirect('/patientlogin');
    }
    const patient_id = req.session.patientId;
    const query = `SELECT * FROM patient_chat_session WHERE patient_id = ?`;
    con.query(query, [patient_id], (err, sessions) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error fetching patient details");
        } else {
            let initialsession_uuid = null
            let initialChat_history = []
            if (sessions.length > 0) {
                initialsession_uuid = sessions[0].session_uuid
                const chatquery = `SELECT * FROM patient_chat_history WHERE session_id = ? ORDER BY timestamp ASC`;
                con.query(chatquery, [initialsession_uuid], (err, chat_history) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send("Error fetching chat history");
                    }
                    else {
                        res.render('patientpage/patientai', {
                            patient_id: patient_id,
                            sessions: sessions,
                            chatHistory: chat_history,
                            initialSessionId: initialsession_uuid,
                            initialChatHistory: chat_history
                        })
                    }
                })
            }
            else {
                res.render('patientpage/patientai', {
                    patient_id: patient_id,
                    sessions: [],
                    chatHistory: [],
                    initialSessionId: null,
                    initialChatHistory: []
                })
            }
        }

    })
})
app.get('/patient/ai/chat/:session_uuid', (req, res) => {
    if (!req.session.patientId) {
        return res.redirect('/patientlogin');
    }
    const patient_id = req.session.patientId;
    const session_uuid = req.params.session_uuid

    const sessionquery = "SELECT * FROM patient_chat_session WHERE patient_id = ? AND session_uuid = ?";
    con.query(sessionquery, [patient_id, session_uuid], (err, sessions) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ "error": "Error fetching session details" });
        }
        if (sessions.length === 0) {
            return res.status(404).json({ "error": "Session not found" });
        }
        const chatquery = `SELECT * FROM patient_chat_history WHERE session_id = ? ORDER BY timestamp ASC`;
        con.query(chatquery, [session_uuid], (err, chat_history) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ "error": "Error fetching chat history" });
            }
            res.json({ chat_history: chat_history, session: sessions[0] });
        });
    });
})






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
app.post('/notifications/mark-as-read', (req, res) => {
    const { notification_id } = req.body;
    const query = `UPDATE notifications SET is_read = 1 WHERE notification_id = ?`;
    con.query(query, [notification_id], (err, result) => {
        if (err) {
            console.error("Error marking notification:", err);
            return res.status(500).send('Error marking notification');
        }
        res.redirect('/doctoradmin');
    });
})
app.post('/admin/ai/newchat', (req, res) => {
    const admin_id = req.session.admin_id;
    const session_uuid = uuidv4(); // Generate a new UUID for the session
    if (!admin_id) {
        return res.status(400).json({ error: "Admin ID is required" });
    }
    const query = `INSERT INTO chat_session (admin_id, session_uuid) VALUES (?, ?)`;
    con.query(query, [admin_id, session_uuid], (err, result) => {
        if (err) {
            console.error("Error creating new chat session:", err);
            return res.status(500).json({ error: 'Error creating chat session' });
        }
        else {
            res.status(200).json({
                session_uuid: session_uuid,
            })
        }
    });
})
app.post("/admin/ai/chat/:session_uuid/rename", (req, res) => {
    const session_uuid = req.params.session_uuid;
    const newName = req.body.newName;
    const query = `UPDATE chat_session SET name = ? WHERE session_uuid = ?`;
    con.query(query, [newName, session_uuid], (err, result) => {
        if (err) {
            console.error("Error updating chat session name:", err);
        }
        else {
            res.status(200).json({ message: "Chat session name updated successfully" });
        }
    })
})
app.delete("/admin/ai/chat/:session_uuid/delete", (req, res) => {
    const session_uuid = req.params.session_uuid;
    if (!session_uuid) {
        return res.status(400).json({ error: "session_uuid is required" });
    }
    const deleteChatQuery = `DELETE FROM chat_session WHERE session_uuid = ?`;
    con.query(deleteChatQuery, [session_uuid], (err, result) => {
        if (err) {
            console.error("Error deleting chat session:", err);
        }
        else {
            const deleteHistoryQuery = `DELETE FROM chat_history WHERE session_uuid = ?`;
            con.query(deleteHistoryQuery, [session_uuid], (err, result) => {
                if (err) {
                    console.error("Error deleting chat history:", err);
                }
                else {
                    res.status(200).json({ message: "Chat session and history deleted successfully" });
                }
            })
        }
    })
})
app.post('/patient/ai/newchat', (req, res) => {
    if (!req.session.patientId) {
        return res.status(400).json({ error: "Patient_id is required" })
    }
    const patient_id = req.session.patientId;
    const session_uuid = uuidv4();
    const query = `INSERT INTO patient_chat_session (patient_id,session_uuid) VALUES (?, ?)`;
    con.query(query, [patient_id, session_uuid], (err, result) => {
        if (err) {
            console.error("Error creating new chat session:", err);
            return res.status(500).json({ error: 'Error creating chat session' });
        }
        else {
            res.status(200).json({
                session_uuid: session_uuid,
            })
        }
    });
})
server.listen(4000, () => {
    console.log(`Server running on port 4000`);
});
