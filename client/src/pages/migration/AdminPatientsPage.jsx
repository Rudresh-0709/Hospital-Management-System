import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { getAdminPatientsOverview } from '../../services/adminApi';

function AdminPatientsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState({ patients: [], doctors: [], rooms: [], message: null });
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      const response = await getAdminPatientsOverview();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load patients overview');
        setLoading(false);
        return;
      }

      setPayload({
        patients: response.data.patients || [],
        doctors: response.data.doctors || [],
        rooms: response.data.rooms || [],
        message: response.data.message || null,
      });
      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return payload.patients;

    return payload.patients.filter((patient) => {
      const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
      return (
        fullName.includes(term)
        || String(patient.patient_id || '').toLowerCase().includes(term)
        || String(patient.doctor_assigned || '').toLowerCase().includes(term)
      );
    });
  }, [payload.patients, search]);

  return (
    <AdminShell title="New Patient">
      <section className="card">
        <h3 className="card-title">Patient Management Overview</h3>
        <div className="summary-grid">
          <div>Patients: <strong>{payload.patients.length}</strong></div>
          <div>Doctors: <strong>{payload.doctors.length}</strong></div>
          <div>Open Rooms: <strong>{payload.rooms.length}</strong></div>
        </div>
      </section>

      <section className="card">
        <div className="toolbar">
          <h3 className="card-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Patient List</h3>
          <input
            className="field"
            placeholder="Search by patient id, name, doctor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 280, marginBottom: 0 }}
          />
        </div>

        {loading && <p className="muted">Loading patient overview...</p>}
        {!loading && error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Doctor Assigned</th>
                  <th>Admit Date</th>
                  <th>Discharge Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, idx) => (
                  <tr key={`${patient.patient_id}-${patient.admit_id || patient.emergency_id || idx}`}>
                    <td>{patient.patient_id}</td>
                    <td>{patient.first_name} {patient.last_name}</td>
                    <td>{patient.doctor_assigned || '-'}</td>
                    <td>{patient.admit_date ? String(patient.admit_date).slice(0, 10) : '-'}</td>
                    <td>{patient.discharge_date ? String(patient.discharge_date).slice(0, 10) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredPatients.length && <p className="muted" style={{ marginTop: 12 }}>No matching patients found.</p>}
          </div>
        )}
      </section>
    </AdminShell>
  );
}

export default AdminPatientsPage;
