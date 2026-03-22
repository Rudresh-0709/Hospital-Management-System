import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function DoctorShell({ title, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="migrate-ejs doctor-migrate">
      <div className="page">
        <section className="section">
          <div className="heading">
            <h1 className="heading-title">{title}</h1>
          </div>
          <div className="card" style={{ marginTop: 8 }}>
            <p className="muted" style={{ margin: '8px 0' }}>
              React migration doctor module. Logged in as: {user?.name || 'Unknown'} ({user?.role || 'n/a'})
            </p>
            <div className="nav-row">
              <Link to="/migrate">Migration Home</Link>
              <Link to="/migrate/dashboard">Migration Dashboard</Link>
              <Link to="/migrate/doctor/visitnavigation">Doctor Visit Navigation (React)</Link>
              <Link to="/migrate/doctor/appointmentapprove">Doctor Appointment Approval (React)</Link>
              <Link to="/migrate/doctor/dashboard">Doctor Dashboard (React)</Link>
              <a href="/doctor/visitnavigation">Legacy Visit Navigation (EJS)</a>
              <a href="/doctor/appointmentapprove">Legacy Appointment Approval (EJS)</a>
              <a href="/doctoradmin">Legacy Doctor Dashboard (EJS)</a>
              <button className="btn" onClick={logout}>Logout</button>
            </div>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

export default DoctorShell;
