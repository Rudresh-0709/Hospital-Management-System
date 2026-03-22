import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function MigrationHome() {
  const { authenticated, user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 900, margin: '32px auto', padding: 16, fontFamily: 'Segoe UI, sans-serif' }}>
      <h1>Migration Zone</h1>
      <p>This area is the gradual React replacement while legacy EJS pages remain active.</p>

      <div style={{ border: '1px solid #d5d8de', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <h3>Session</h3>
        <pre>{JSON.stringify({ authenticated, user }, null, 2)}</pre>
        {authenticated && <button onClick={logout}>Logout</button>}
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <Link to="/migrate/login/admin">Admin Login (React)</Link>
        <Link to="/migrate/login/doctor">Doctor Login (React)</Link>
        <Link to="/migrate/login/patient">Patient Login (React)</Link>
        <Link to="/migrate/dashboard">Migration Dashboard (Protected)</Link>
        <Link to="/migrate/admin/patients">Admin Patients Page (React)</Link>
        <Link to="/migrate/admin/admit">Admin Admit Page (React)</Link>
        <Link to="/migrate/admin/dashboard">Admin Dashboard (React)</Link>
        <Link to="/migrate/doctor/visitnavigation">Doctor Visit Navigation (React)</Link>
        <Link to="/migrate/doctor/appointmentapprove">Doctor Appointment Approval (React)</Link>
        <Link to="/migrate/doctor/dashboard">Doctor Dashboard (React)</Link>
        <Link to="/migrate/patient/dashboard">Patient Dashboard (React)</Link>
        <Link to="/migrate/auth">Auth API Test Console</Link>
        <a href="/adminlogin">Legacy Admin Login (EJS)</a>
        <a href="/patientlogin">Legacy Patient Login (EJS)</a>
      </div>
    </div>
  );
}

export default MigrationHome;
