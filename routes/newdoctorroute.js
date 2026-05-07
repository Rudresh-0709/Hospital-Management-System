const con = require("../models/db");

const insertDoctorQuery = `
  INSERT INTO doctors (doctor_name, speciality, doctor_in, doctor_out, doctor_password)
  VALUES (?, ?, ?, ?, ?)
`;

function normalizeDoctorPayload(payload = {}) {
  return {
    doctor_name: typeof payload.doctor_name === 'string' ? payload.doctor_name.trim() : '',
    speciality: typeof payload.speciality === 'string' ? payload.speciality.trim() : '',
    doctor_in: typeof payload.doctor_in === 'string' ? payload.doctor_in.trim() : '',
    doctor_out: typeof payload.doctor_out === 'string' ? payload.doctor_out.trim() : '',
    doctor_password: typeof payload.doctor_password === 'string' ? payload.doctor_password.trim() : '',
  };
}

function validateDoctorPayload(payload = {}) {
  const normalized = normalizeDoctorPayload(payload);
  if (!normalized.doctor_name || !normalized.speciality || !normalized.doctor_in || !normalized.doctor_out || !normalized.doctor_password) {
    return { valid: false, message: 'All doctor fields are required' };
  }

  return { valid: true, doctor: normalized };
}

function createDoctor(payload, callback) {
  const validation = validateDoctorPayload(payload);
  if (!validation.valid) {
    return callback({ statusCode: 400, message: validation.message });
  }

  const { doctor_name, speciality, doctor_in, doctor_out, doctor_password } = validation.doctor;
  return con.query(insertDoctorQuery, [doctor_name, speciality, doctor_in, doctor_out, doctor_password], (error, result) => {
    if (error) {
      return callback({ statusCode: 500, message: 'Failed to add doctor' });
    }

    return callback(null, { result, doctor: validation.doctor });
  });
}

function handleNewDoctor(req, res) {
  return createDoctor(req.body, (error) => {
    if (error) {
      req.flash('message', error.message || 'Failed to add doctor');
      return res.redirect('/admin/newdoctor');
    }

    req.flash('message', 'Doctor Assigned Successfully');
    return res.redirect('/admin/newdoctor');
  });
}

module.exports = {
  createDoctor,
  handleNewDoctor,
};
