import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DoctorShell from '../../components/migration/DoctorShell';
import { getDoctorVisitNavigation } from '../../services/doctorApi';

function DoctorVisitNavigationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctorName, setDoctorName] = useState('Doctor');

  useEffect(() => {
    async function load() {
      const response = await getDoctorVisitNavigation();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load navigation');
        setLoading(false);
        return;
      }

      setDoctorName(response.data?.doctor_name || 'Doctor');
      setLoading(false);
    }

    load();
  }, []);

  return (
    <DoctorShell title="Doctor Navigation">
      <section className="card">
        <h3 className="card-title">Welcome Dr. {doctorName}</h3>
        {loading && <p className="muted">Loading navigation...</p>}
        {!loading && error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(180px, 1fr))' }}>
            <div className="card" style={{ margin: 0 }}>
              <h3 className="card-title">Manage Appointments</h3>
              <p className="muted">View and schedule appointments for new patients.</p>
              <Link to="/doctor/appointmentapprove">Go to Appointments</Link>
            </div>
            <div className="card" style={{ margin: 0 }}>
              <h3 className="card-title">Manage Visits</h3>
              <p className="muted">Track visits and provide medical care for admitted patients.</p>
              <Link to="/doctor/dashboard">Go to Visits</Link>
            </div>
          </div>
        )}
      </section>
    </DoctorShell>
  );
}

export default DoctorVisitNavigationPage;

