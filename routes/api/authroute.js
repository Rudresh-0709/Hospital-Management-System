const express = require('express');
const con = require('../../models/db');
const User = require('../../models/userModel');

const router = express.Router();

function buildSessionUser(req) {
    if (req.session.currentUser) {
        return {
            role: req.session.currentUser.role,
            name: req.session.currentUser.name,
            userId: req.session.currentUser._id,
            patientId: req.session.patientId || null,
            adminId: req.session.admin_id || null,
            doctorName: req.session.doctor_name || null,
            adminName: req.session.admin_name || null,
            patientName: req.session.patientName || null,
        };
    }

    if (req.session.admin_id) {
        return {
            role: 'admin',
            name: req.session.admin_name,
            adminId: req.session.admin_id,
        };
    }

    return null;
}

router.get('/status', (req, res) => {
    const user = buildSessionUser(req);
    if (!user) {
        return res.status(200).json({ authenticated: false, user: null });
    }

    return res.status(200).json({ authenticated: true, user });
});

router.post('/login/admin', (req, res) => {
    const { admin_name, admin_password } = req.body;
    if (!admin_name || !admin_password) {
        return res.status(400).json({ success: false, message: 'admin_name and admin_password are required' });
    }

    const query = 'SELECT * FROM admin WHERE admin_name = ?';
    con.query(query, [admin_name], (error, admindetails) => {
        if (error) {
            console.error('Admin login database error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        if (!admindetails.length || admindetails[0].admin_password !== admin_password) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        req.session.admin_name = admindetails[0].admin_name;
        req.session.admin_id = admindetails[0].admin_id;

        return res.status(200).json({
            success: true,
            message: 'Admin login successful',
            user: {
                role: 'admin',
                name: req.session.admin_name,
                adminId: req.session.admin_id,
            },
        });
    });
});

router.post('/login/doctor', (req, res) => {
    const { doctor_name, doctor_password } = req.body;
    if (!doctor_name || !doctor_password) {
        return res.status(400).json({ success: false, message: 'doctor_name and doctor_password are required' });
    }

    const query = 'SELECT * FROM doctors WHERE doctor_name = ?';
    con.query(query, [doctor_name], (error, doctordetails) => {
        if (error) {
            console.error('Doctor login database error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        if (!doctordetails.length || doctordetails[0].doctor_password !== doctor_password) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        User.findOne({ name: doctor_name, role: 'doctor' })
            .exec()
            .then((existingUser) => {
                if (existingUser) return existingUser;
                const newDoctor = new User({
                    name: doctor_name,
                    email: '',
                    role: 'doctor',
                });
                return newDoctor.save();
            })
            .then((user) => {
                req.session.currentUser = user;
                req.session.doctor_name = doctor_name;
                return res.status(200).json({
                    success: true,
                    message: 'Doctor login successful',
                    user: {
                        role: user.role,
                        name: user.name,
                        userId: user._id,
                    },
                });
            })
            .catch((err) => {
                console.error('Doctor login mongoose error:', err);
                return res.status(500).json({ success: false, message: 'Internal server error' });
            });
    });
});

router.post('/login/patient', (req, res) => {
    const { name, password } = req.body;
    if (!name || !password) {
        return res.status(400).json({ success: false, message: 'name and password are required' });
    }

    const [firstName, ...lastParts] = name.trim().split(' ');
    const lastName = lastParts.join(' ');
    if (!firstName || !lastName) {
        return res.status(400).json({ success: false, message: 'Provide full name as first and last name' });
    }

    const query = 'SELECT * FROM patients WHERE first_name = ? AND last_name = ?';
    con.query(query, [firstName, lastName], (err, result) => {
        if (err) {
            console.error('Patient login database error:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        if (!result.length || result[0].password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        const patient = result[0];
        const fullName = `${patient.first_name} ${patient.last_name}`;

        User.findOne({ name: fullName, role: 'patient' })
            .exec()
            .then((existingUser) => {
                if (existingUser) return existingUser;
                const newPatient = new User({
                    name: fullName,
                    email: patient.email || '',
                    role: 'patient',
                });
                return newPatient.save();
            })
            .then((user) => {
                req.session.currentUser = user;
                req.session.patientId = patient.patient_id;
                req.session.patientName = fullName;
                return res.status(200).json({
                    success: true,
                    message: 'Patient login successful',
                    user: {
                        role: user.role,
                        name: user.name,
                        userId: user._id,
                        patientId: patient.patient_id,
                    },
                });
            })
            .catch((mongoErr) => {
                console.error('Patient login mongoose error:', mongoErr);
                return res.status(500).json({ success: false, message: 'Internal server error' });
            });
    });
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destroy error:', err);
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        return res.status(200).json({ success: true, message: 'Logged out' });
    });
});

module.exports = router;