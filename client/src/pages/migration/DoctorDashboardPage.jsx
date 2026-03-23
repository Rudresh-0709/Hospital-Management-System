import { useEffect, useState } from 'react';
import DoctorShell from '../../components/migration/DoctorShell';
import { getDoctorDashboardOverview } from '../../services/doctorApi';
import { getPatientFullName } from '../../utils/patientName';

function DoctorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState({
    doctordetails: null,
    patientdetails: [],
    appointments: [],
    nurses: [],
    notifications: [],
    chartLabels: [],
    chartData: [],
  });

  useEffect(() => {
    async function fetchData() {
      const response = await getDoctorDashboardOverview();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load doctor dashboard');
        setLoading(false);
        return;
      }

      setPayload({
        doctordetails: response.data.doctordetails || null,
        patientdetails: response.data.patientdetails || [],
        appointments: response.data.appointments || [],
        nurses: response.data.nurses || [],
        notifications: response.data.notifications || [],
        chartLabels: response.data.chartLabels || [],
        chartData: response.data.chartData || [],
      });
      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <DoctorShell title="Doctor Dashboard">
      <section className="card">
        <h3 className="card-title">
          Welcome {payload.doctordetails?.doctor_name ? `Dr. ${payload.doctordetails.doctor_name}` : 'Doctor'}
        </h3>

        {loading && <p className="muted">Loading dashboard...</p>}
        {!loading && error && <p className="error">{error}</p>}

        {!loading && !error && (
          <>
            <div className="summary-grid" style={{ marginBottom: 18 }}>
              <div>Total Patients: <strong>{payload.patientdetails.length}</strong></div>
              <div>Today's Appointments: <strong>{payload.appointments.length}</strong></div>
              <div>Available Nurses: <strong>{payload.nurses.filter((n) => Number(n.available) === 1).length}</strong></div>
            </div>

            <div className="card" style={{ margin: 0, marginBottom: 14 }}>
              <h3 className="card-title">Recent Patients</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Reason</th>
                      <th>Room</th>
                      <th>Ward</th>
                      <th>Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.patientdetails.length > 0 ? (
                      payload.patientdetails.slice(-5).reverse().map((patient, idx) => (
                        <tr key={`${patient.patient_id}-${idx}`}>
                          <td>{getPatientFullName(patient)}</td>
                          <td>{patient.reason_for_admission || '-'}</td>
                          <td>{patient.room_number || '-'}</td>
                          <td>{patient.ward_preference || '-'}</td>
                          <td>{patient.gender || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5}>No patient data available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" style={{ margin: 0, marginBottom: 14 }}>
              <h3 className="card-title">Notifications</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Message</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.notifications.length > 0 ? (
                      payload.notifications.slice(0, 6).map((notification, idx) => (
                        <tr key={`${notification.notification_id || idx}-${idx}`}>
                          <td>{notification.message}</td>
                          <td>{notification.created_at ? String(notification.created_at).slice(0, 19).replace('T', ' ') : '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={2}>No notifications.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" style={{ margin: 0 }}>
              <h3 className="card-title">Admission Trend Data</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Patient Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.chartLabels.length > 0 ? (
                      payload.chartLabels.map((label, idx) => (
                        <tr key={`${label}-${idx}`}>
                          <td>{String(label).slice(0, 10)}</td>
                          <td>{payload.chartData[idx] ?? 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={2}>No trend data available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </DoctorShell>
  );
}

export default DoctorDashboardPage;
