import { useEffect, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { getAdminPatientHistory } from '../../services/adminApi';
import { getPatientFullName } from '../../utils/patientName';
import '../../styles/patient-history-ejs.css';

const defaultFilters = {
  gender: '',
  ward_preference: '',
  sort: '',
};

function AdminPatientHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);

  const loadHistory = async (nextFilters = filters) => {
    setLoading(true);
    setError('');

    const response = await getAdminPatientHistory(nextFilters);
    if (!response.ok) {
      setError(response.data?.message || 'Failed to load patient history');
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(response.data.patientdetails || []);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory(defaultFilters);
  }, []);

  const onApply = async (event) => {
    event.preventDefault();
    await loadHistory(filters);
  };

  return (
    <AdminShell title="Patient History">
      <section className="card migrate-history-card">
        <div className="migrate-history-scroll-wrapper">
          <h3 className="migrate-history-title">Patient History</h3>

          <form className="migrate-history-filter" onSubmit={onApply}>
            <label htmlFor="history_gender">Filter by Gender:</label>
            <select
              id="history_gender"
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
            >
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="male">male</option>
              <option value="female">female</option>
            </select>

            <label htmlFor="history_ward">Filter by Ward:</label>
            <select
              id="history_ward"
              value={filters.ward_preference}
              onChange={(e) => setFilters({ ...filters, ward_preference: e.target.value })}
            >
              <option value="">All</option>
              <option value="general">General</option>
              <option value="private">Private</option>
              <option value="General">General (Title)</option>
              <option value="Private">Private (Title)</option>
            </select>

            <label htmlFor="history_sort">Sort By:</label>
            <select
              id="history_sort"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            >
              <option value="">Default</option>
              <option value="admission_date_asc">Admission Date (Ascending)</option>
              <option value="admission_date_desc">Admission Date (Descending)</option>
              <option value="discharge_date_asc">Discharge Date (Ascending)</option>
              <option value="discharge_date_desc">Discharge Date (Descending)</option>
            </select>

            <button type="submit">Apply</button>
          </form>

          {loading && <p className="muted">Loading patient history...</p>}
          {!loading && error && <p className="error">{error}</p>}

          {!loading && !error && (
            <div className="table-wrap">
              <table className="migrate-history-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Date of Birth</th>
                    <th>Gender</th>
                    <th>Contact Number</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Emergency Contact Name</th>
                    <th>Relationship</th>
                    <th>Emergency Contact</th>
                    <th>Reason for Admission</th>
                    <th>Doctor Assigned</th>
                    <th>Ward Preference</th>
                    <th>Room Number</th>
                    <th>Admission Date</th>
                    <th>Discharge Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={`${row.patient_id || idx}-${idx}`}>
                      <td>{getPatientFullName(row)}</td>
                      <td>{row.dob ? String(row.dob).slice(0, 10) : '-'}</td>
                      <td>{row.gender || '-'}</td>
                      <td>{row.contact_number || '-'}</td>
                      <td>{row.email || '-'}</td>
                      <td>{row.address || '-'}</td>
                      <td>{row.emergency_name || '-'}</td>
                      <td>{row.relationship || '-'}</td>
                      <td>{row.emergency_contact || '-'}</td>
                      <td>{row.reason_for_admission || '-'}</td>
                      <td>{row.doctor_assigned || '-'}</td>
                      <td>{row.ward_preference || '-'}</td>
                      <td>{row.room_number || '-'}</td>
                      <td>{row.admission_date ? String(row.admission_date).slice(0, 10) : '-'}</td>
                      <td>{row.discharge_date ? String(row.discharge_date).slice(0, 10) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

export default AdminPatientHistoryPage;
