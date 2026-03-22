import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { getAdminAdmitOverview } from '../../services/adminApi';

function AdminAdmitPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState({ patients: [], doctors: [], rooms: [], message: null });
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      const response = await getAdminAdmitOverview();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load admit overview');
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
      );
    });
  }, [payload.patients, search]);

  return (
    <AdminShell title="Admit Patient">
      <section className="card">
        <h3 className="card-title">Admission Details Overview</h3>
        <div className="summary-grid">
          <div>Eligible Patients: <strong>{payload.patients.length}</strong></div>
          <div>Doctors: <strong>{payload.doctors.length}</strong></div>
          <div>Open Rooms: <strong>{payload.rooms.length}</strong></div>
        </div>
      </section>

      <section className="card">
        <div className="toolbar">
          <h3 className="card-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Admit Candidate List</h3>
          <input
            className="field"
            placeholder="Search by patient id or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 280, marginBottom: 0 }}
          />
        </div>

        {loading && <p className="muted">Loading admit overview...</p>}
        {!loading && error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Last Discharge Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, idx) => (
                  <tr key={`${patient.patient_id}-${idx}`}>
                    <td>{patient.patient_id}</td>
                    <td>{patient.first_name} {patient.last_name}</td>
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

export default AdminAdmitPage;
