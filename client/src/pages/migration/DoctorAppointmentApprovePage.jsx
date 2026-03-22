import { useEffect, useState } from 'react';
import DoctorShell from '../../components/migration/DoctorShell';
import {
  approveAppointment,
  getPendingAppointments,
  rejectAppointment,
} from '../../services/doctorApi';

function DoctorAppointmentApprovePage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPending = async () => {
    setLoading(true);
    setError('');
    const response = await getPendingAppointments();
    if (!response.ok) {
      setError(response.data?.message || 'Failed to load appointments');
      setAppointments([]);
      setLoading(false);
      return;
    }

    setAppointments(response.data.appointments || []);
    setLoading(false);
  };

  useEffect(() => {
    loadPending();
  }, []);

  const onApprove = async (appointmentId) => {
    setSuccess('');
    setError('');
    const response = await approveAppointment(appointmentId);
    if (!response.ok) {
      setError(response.data?.message || 'Failed to approve appointment');
      return;
    }
    setSuccess(response.data?.message || 'Appointment approved.');
    await loadPending();
  };

  const onReject = async (appointmentId) => {
    setSuccess('');
    setError('');
    const response = await rejectAppointment(appointmentId);
    if (!response.ok) {
      setError(response.data?.message || 'Failed to reject appointment');
      return;
    }
    setSuccess(response.data?.message || 'Appointment rejected.');
    await loadPending();
  };

  return (
    <DoctorShell title="Pending Appointments">
      <section className="card">
        <h3 className="card-title">Pending Appointments</h3>

        {loading && <p className="muted">Loading appointments...</p>}
        {!loading && error && <p className="error">{error}</p>}
        {!loading && success && <p className="success">{success}</p>}

        {!loading && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length > 0 ? (
                  appointments.map((appointment) => (
                    <tr key={appointment.appointment_id}>
                      <td>{appointment.appointee_name}</td>
                      <td>{appointment.appointment_date}</td>
                      <td>{appointment.appointment_time}</td>
                      <td>{appointment.purpose}</td>
                      <td>
                        <button
                          type="button"
                          className="btn"
                          style={{ marginRight: 8, width: 110, height: 34 }}
                          onClick={() => onApprove(appointment.appointment_id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{ width: 110, height: 34, backgroundColor: '#9a3340' }}
                          onClick={() => onReject(appointment.appointment_id)}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>No pending appointments at the moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DoctorShell>
  );
}

export default DoctorAppointmentApprovePage;
