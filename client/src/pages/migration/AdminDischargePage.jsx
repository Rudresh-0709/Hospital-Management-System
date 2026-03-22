import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { dischargePatient, getAdminDischargeOverview } from '../../services/adminApi';

function AdminDischargePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    reason_for_admission: '',
  });

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    const response = await getAdminDischargeOverview();

    if (!response.ok) {
      setError(response.data?.message || 'Failed to load discharge overview');
      setPatients([]);
      setLoading(false);
      return;
    }

    const nextPatients = response.data.patients || [];
    setPatients(nextPatients);
    setForm((prev) => ({
      ...prev,
      first_name: prev.first_name || nextPatients[0]?.first_name || '',
      last_name: prev.last_name || nextPatients[0]?.last_name || '',
    }));
    setLoading(false);
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;

    return patients.filter((patient) => {
      const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
      return fullName.includes(term) || String(patient.patient_id || '').includes(term);
    });
  }, [patients, search]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const response = await dischargePatient(form);
    setSubmitting(false);

    if (!response.ok) {
      setError(response.data?.message || 'Failed to discharge patient');
      return;
    }

    setSuccess(response.data?.message || 'Patient discharged successfully');
    setForm((prev) => ({ ...prev, reason_for_admission: '' }));
    await loadOverview();
  };

  return (
    <AdminShell title="Discharge Patient">
      <section className="card">
        <h3 className="card-title">Discharge Details</h3>

        {loading && <p className="muted">Loading discharge overview...</p>}
        {!loading && error && <p className="error">{error}</p>}
        {!loading && success && <p className="success">{success}</p>}

        {!loading && !patients.length && <p className="muted">No admitted patients available for discharge.</p>}

        {!loading && patients.length > 0 && (
          <form onSubmit={onSubmit}>
            <div className="split-grid">
              <div>
                <label className="field-label" htmlFor="discharge_first_name">First name:</label>
                <select
                  id="discharge_first_name"
                  className="field"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                >
                  {patients.map((patient, idx) => (
                    <option key={`${patient.patient_id}-first-${idx}`} value={patient.first_name}>{patient.first_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="discharge_last_name">Last name:</label>
                <select
                  id="discharge_last_name"
                  className="field"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                >
                  {patients.map((patient, idx) => (
                    <option key={`${patient.patient_id}-last-${idx}`} value={patient.last_name}>{patient.last_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="field-label" htmlFor="discharge_reason">Reason for Discharge:</label>
            <textarea
              id="discharge_reason"
              className="field"
              rows={3}
              value={form.reason_for_admission}
              onChange={(e) => setForm({ ...form, reason_for_admission: e.target.value })}
              required
            />

            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Processing...' : 'Discharge Patient'}
            </button>
          </form>
        )}
      </section>

      <section className="card">
        <div className="toolbar">
          <h3 className="card-title card-title-tight">Current Admitted Patients</h3>
          <input
            className="field field-tight"
            placeholder="Search by patient id or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Doctor Assigned</th>
                <th>Room Number</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient, idx) => (
                <tr key={`${patient.admit_id || patient.patient_id}-${idx}`}>
                  <td>{patient.patient_id}</td>
                  <td>{patient.first_name} {patient.last_name}</td>
                  <td>{patient.doctor_assigned || '-'}</td>
                  <td>{patient.room_number || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredPatients.length && <p className="muted mt-12">No matching patients found.</p>}
        </div>
      </section>
    </AdminShell>
  );
}

export default AdminDischargePage;
