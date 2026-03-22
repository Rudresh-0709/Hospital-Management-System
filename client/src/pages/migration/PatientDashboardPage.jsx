import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPatientDashboardOverview } from '../../services/patientApi';
import '../../styles/patient-dashboard-ejs.css';

function PatientDashboardPage() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState({ patient: null, notifications: [], prescriptions: [] });

  useEffect(() => {
    async function load() {
      const response = await getPatientDashboardOverview();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load patient dashboard');
        setLoading(false);
        return;
      }

      setPayload({
        patient: response.data.patient || null,
        notifications: response.data.notifications || [],
        prescriptions: response.data.prescriptions || [],
      });
      setLoading(false);
    }

    load();
  }, []);

  const medicationList = useMemo(() => payload.prescriptions.slice(0, 8), [payload.prescriptions]);

  return (
    <div className="migrate-patient-dashboard">
      <header className="pd-header">
        <div className="pd-profile">{payload.patient ? `${payload.patient.first_name} ${payload.patient.last_name}` : 'Patient'}</div>
        <div className="pd-actions">
          <Link to="/patient/ai">Chat with Agent</Link>
          <a href="/chat">Contact Doctor</a>
          <button type="button" onClick={logout}>Logout</button>
        </div>
      </header>

      {loading && <div className="pd-card">Loading dashboard...</div>}
      {!loading && error && <div className="pd-card pd-error">{error}</div>}

      {!loading && !error && (
        <main className="pd-main">
          <section className="pd-card">
            <h3>Medication</h3>
            <ul>
              {medicationList.length > 0 ? (
                medicationList.map((item, idx) => (
                  <li key={`${item.prescription_id || idx}-${idx}`}>
                    <strong>{item.time_of_intake || 'Time N/A'}</strong> - {item.medicine_name || 'Medicine'}
                  </li>
                ))
              ) : (
                <li>No prescriptions available.</li>
              )}
            </ul>
          </section>

          <section className="pd-card">
            <h3>Notifications</h3>
            <ul>
              {payload.notifications.length > 0 ? (
                payload.notifications.slice(0, 8).map((notification, idx) => (
                  <li key={`${notification.notification_id || idx}-${idx}`}>
                    <strong>{notification.message}</strong>
                    <div>{notification.created_at ? String(notification.created_at).slice(0, 19).replace('T', ' ') : ''}</div>
                  </li>
                ))
              ) : (
                <li>No notifications.</li>
              )}
            </ul>
          </section>
        </main>
      )}
    </div>
  );
}

export default PatientDashboardPage;
