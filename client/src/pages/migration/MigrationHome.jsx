import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function MigrationHome() {
  const { authenticated, user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 900, margin: '32px auto', padding: 16, fontFamily: 'Segoe UI, sans-serif' }}>
      <h1>React App Portal</h1>
      <p>Central navigation for the React application.</p>

      <div style={{ border: '1px solid #d5d8de', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <h3>Session</h3>
        <pre>{JSON.stringify({ authenticated, user }, null, 2)}</pre>
        {authenticated && <button onClick={logout}>Logout</button>}
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <Link to="/login/admin">Admin Login (React)</Link>
        <Link to="/login/doctor">Doctor Login (React)</Link>
        <Link to="/login/patient">Patient Login (React)</Link>
        <Link to="/dashboard">Migration Dashboard (Protected)</Link>
        <Link to="/admin/patients">Admin Patients Page (React)</Link>
        <Link to="/admin/admit">Admin Admit Page (React)</Link>
        <Link to="/admin/dashboard">Admin Dashboard (React)</Link>
        <Link to="/doctor/visitnavigation">Doctor Visit Navigation (React)</Link>
        <Link to="/doctor/appointmentapprove">Doctor Appointment Approval (React)</Link>
        <Link to="/doctor/dashboard">Doctor Dashboard (React)</Link>
        <Link to="/doctor/diagnosis">Doctor Diagnosis (React)</Link>
        <Link to="/doctor/prescription">Doctor Prescription (React)</Link>
        <Link to="/doctor/newprescription">Doctor New Prescription (React)</Link>
        <Link to="/appointmentbook">Appointment Book (React)</Link>
        <Link to="/chat">Chat (React)</Link>
        <Link to="/admin/nurse">Admin Nurse (React)</Link>
        <Link to="/admin/equipment/newequipment">Admin New Equipment (React)</Link>
        <Link to="/admin/equipment/updateequipment">Admin Update Equipment (React)</Link>
        <Link to="/nurse/allocation-form?admit_id=1">Nurse Allocation Form (React)</Link>
        <Link to="/patient/dashboard">Patient Dashboard (React)</Link>
        <Link to="/patient/ai">Patient AI (React)</Link>
        <Link to="/chat/setting">Chat Settings (React)</Link>
        <Link to="/video-chat">Video Chat (React)</Link>
        <Link to="/auth">Auth API Test Console</Link>
      </div>
    </div>
  );
}

export default MigrationHome;

