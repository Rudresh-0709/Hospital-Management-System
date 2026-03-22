import { useState } from 'react';
import {
  getAuthStatus,
  loginAdmin,
  loginDoctor,
  loginPatient,
  logout,
} from '../services/authApi';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #d5d8de',
  borderRadius: '10px',
  padding: '16px',
  marginBottom: '12px',
};

function AuthMigrationPage() {
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [admin, setAdmin] = useState({ admin_name: '', admin_password: '' });
  const [doctor, setDoctor] = useState({ doctor_name: '', doctor_password: '' });
  const [patient, setPatient] = useState({ name: '', password: '' });

  const runStatus = async () => {
    const data = await getAuthStatus();
    setStatus(data);
  };

  const runLogout = async () => {
    const response = await logout();
    setResult(response);
    await runStatus();
  };

  const onAdminLogin = async (e) => {
    e.preventDefault();
    const response = await loginAdmin(admin);
    setResult(response);
    await runStatus();
  };

  const onDoctorLogin = async (e) => {
    e.preventDefault();
    const response = await loginDoctor(doctor);
    setResult(response);
    await runStatus();
  };

  const onPatientLogin = async (e) => {
    e.preventDefault();
    const response = await loginPatient(patient);
    setResult(response);
    await runStatus();
  };

  return (
    <div style={{ maxWidth: 960, margin: '32px auto', padding: 16, fontFamily: 'Segoe UI, sans-serif' }}>
      <h1>Auth Migration Test Console</h1>
      <p>Use this page to test new JSON auth APIs while old EJS login pages remain active.</p>

      <div style={{ marginBottom: 16 }}>
        <button onClick={runStatus} style={{ marginRight: 8 }}>Check Session Status</button>
        <button onClick={runLogout}>Logout</button>
      </div>

      <div style={cardStyle}>
        <h3>Current Session</h3>
        <pre>{JSON.stringify(status, null, 2)}</pre>
      </div>

      <div style={cardStyle}>
        <h3>Last API Result</h3>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </div>

      <div style={cardStyle}>
        <h3>Admin Login</h3>
        <form onSubmit={onAdminLogin}>
          <input
            placeholder="admin_name"
            value={admin.admin_name}
            onChange={(e) => setAdmin({ ...admin, admin_name: e.target.value })}
            style={{ marginRight: 8 }}
          />
          <input
            placeholder="admin_password"
            type="password"
            value={admin.admin_password}
            onChange={(e) => setAdmin({ ...admin, admin_password: e.target.value })}
            style={{ marginRight: 8 }}
          />
          <button type="submit">Login Admin</button>
        </form>
      </div>

      <div style={cardStyle}>
        <h3>Doctor Login</h3>
        <form onSubmit={onDoctorLogin}>
          <input
            placeholder="doctor_name"
            value={doctor.doctor_name}
            onChange={(e) => setDoctor({ ...doctor, doctor_name: e.target.value })}
            style={{ marginRight: 8 }}
          />
          <input
            placeholder="doctor_password"
            type="password"
            value={doctor.doctor_password}
            onChange={(e) => setDoctor({ ...doctor, doctor_password: e.target.value })}
            style={{ marginRight: 8 }}
          />
          <button type="submit">Login Doctor</button>
        </form>
      </div>

      <div style={cardStyle}>
        <h3>Patient Login</h3>
        <form onSubmit={onPatientLogin}>
          <input
            placeholder="full name (First Last)"
            value={patient.name}
            onChange={(e) => setPatient({ ...patient, name: e.target.value })}
            style={{ marginRight: 8 }}
          />
          <input
            placeholder="password"
            type="password"
            value={patient.password}
            onChange={(e) => setPatient({ ...patient, password: e.target.value })}
            style={{ marginRight: 8 }}
          />
          <button type="submit">Login Patient</button>
        </form>
      </div>
    </div>
  );
}

export default AuthMigrationPage;
