import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AdminShell({ title, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="migrate-ejs">
      <div className="page">
        <section className="section">
          <div className="heading">
            <h1 className="heading-title">{title}</h1>
          </div>
          <div className="card" style={{ marginTop: 8 }}>
            <p className="muted" style={{ margin: '8px 0' }}>
            React migration admin module. Logged in as: {user?.name || 'Unknown'} ({user?.role || 'n/a'})
            </p>
            <div className="nav-row">
            <Link to="/migrate">Migration Home</Link>
            <Link to="/migrate/dashboard">Migration Dashboard</Link>
            <Link to="/migrate/admin/dashboard">Admin Dashboard (React)</Link>
            <Link to="/migrate/admin/patients">Admin Patients (React)</Link>
            <Link to="/migrate/admin/admit">Admin Admit (React)</Link>
            <Link to="/migrate/admin/discharge">Admin Discharge (React)</Link>
            <Link to="/migrate/admin/patienthistory">Admin History (React)</Link>
            <Link to="/migrate/admin/newvisitor">Admin New Visitor (React)</Link>
            <Link to="/migrate/admin/visit-history">Admin Visit History (React)</Link>
            <Link to="/migrate/admin/visitqr">Admin Visit QR (React)</Link>
            <Link to="/migrate/admin/newdoctor">Admin New Doctor (React)</Link>
            <Link to="/migrate/admin/newstaff">Admin New Staff (React)</Link>
            <Link to="/migrate/admin/equipment">Admin Equipment (React)</Link>
            <Link to="/migrate/admin/pharmacy">Admin Pharmacy (React)</Link>
            <Link to="/migrate/admin/nurseallocate">Admin Nurse Allocate (React)</Link>
            <Link to="/migrate/admin/ai">Admin AI (React)</Link>
            <a href="/admin/patient">Legacy Admin Patients (EJS)</a>
            <a href="/admin/admit">Legacy Admin Admit (EJS)</a>
            <a href="/admin/discharge">Legacy Admin Discharge (EJS)</a>
            <a href="/admin/patienthistory">Legacy Admin History (EJS)</a>
            <a href="/admin/newvisitor">Legacy Admin New Visitor (EJS)</a>
            <a href="/admin/visit-history">Legacy Admin Visit History (EJS)</a>
            <a href="/admin/visitqr">Legacy Admin Visit QR (EJS)</a>
            <a href="/admin/newdoctor">Legacy Admin New Doctor (EJS)</a>
            <a href="/admin/newstaff">Legacy Admin New Staff (EJS)</a>
            <a href="/admin/equipment">Legacy Admin Equipment (EJS)</a>
            <a href="/admin/pharmacy">Legacy Admin Pharmacy (EJS)</a>
            <a href="/admin/nurseallocate">Legacy Admin Nurse Allocate (EJS)</a>
            <a href="/admin/ai">Legacy Admin AI (EJS)</a>
              <button className="btn" onClick={logout}>Logout</button>
            </div>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

export default AdminShell;
