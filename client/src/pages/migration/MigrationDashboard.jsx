import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function MigrationDashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 900, margin: '32px auto', padding: 16, fontFamily: 'Segoe UI, sans-serif' }}>
      <h1>Migration Dashboard</h1>
      <p>This is the first protected React screen for the migration track.</p>

      <div style={{ border: '1px solid #d5d8de', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <h3>Signed in user</h3>
        <pre>{JSON.stringify(user, null, 2)}</pre>
        <button onClick={logout}>Logout</button>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <Link to="/migrate">Back to migration home</Link>
        <a href="/admin">Legacy Admin Dashboard (EJS)</a>
        <a href="/doctoradmin">Legacy Doctor Dashboard (EJS)</a>
        <a href="/patientdashboard">Legacy Patient Dashboard (EJS)</a>
      </div>
    </div>
  );
}

export default MigrationDashboard;
